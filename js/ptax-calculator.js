/**
 * PTax Calculator - Core calculation engine
 * Handles Professional Tax calculations for Indian states
 */

class PTaxCalculator {
    constructor() {
        this.states = [];
        this.ptaxSlabs = [];
        this.isDataLoaded = false;
    }

    /**
     * Initialize the calculator by loading data
     */
    async init() {
        try {
            await this.loadData();
            this.isDataLoaded = true;
            console.log('PTax Calculator initialized successfully');
        } catch (error) {
            console.error('Failed to initialize PTax Calculator:', error);
            throw error;
        }
    }

    /**
     * Load states and PTax slabs data
     */
    async loadData() {
        try {
            const [statesResponse, slabsResponse] = await Promise.all([
                fetch('./data/states.json'),
                fetch('./data/ptax-slabs.json')
            ]);

            if (!statesResponse.ok || !slabsResponse.ok) {
                throw new Error('Failed to load data files');
            }

            this.states = await statesResponse.json();
            this.ptaxSlabs = await slabsResponse.json();

            console.log(`Loaded ${this.states.length} states and ${this.ptaxSlabs.length} PTax slabs`);
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }    /**
     * Get all states sorted alphabetically
     */
    getStates() {
        return this.states
            .filter(state => !state.isActive) // Filter out inactive states if needed
            .sort((a, b) => a.stateName.localeCompare(b.stateName));
    }

    /**
     * Get state by ID
     */
    getStateById(stateId) {
        return this.states.find(state => state.stateId === parseInt(stateId));
    }

    /**
     * Get PTax slabs for a specific state
     */
    getPTaxSlabsByStateId(stateId) {
        const state = this.getStateById(stateId);
        if (!state) {
            throw new Error(`State with ID ${stateId} not found`);
        }

        return this.ptaxSlabs.filter(slab => slab.stateGovId === state.govId);
    }    /**
     * Calculate PTax for given parameters (matches C# PTaxHelper logic)
     * @param {number} stateId - The PTax State ID
     * @param {number} salary - The employee's PTax valuation (salary)
     * @param {string} gender - The employee's gender ('Male', 'Female', or 'All')
     * @param {Date} date - The date for which to calculate PTax (defaults to current date)
     */
    calculatePTax(stateId, salary, gender = 'All', date = new Date()) {
        if (!this.isDataLoaded) {
            throw new Error('Calculator not initialized. Call init() first.');
        }

        const state = this.getStateById(stateId);
        if (!state) {
            throw new Error(`State with ID ${stateId} not found`);
        }

        // Get all slabs for the state, gender, and date (matching C# logic)
        const slabs = this.getValidSlabsForDate(stateId, gender, date);

        if (slabs.length === 0) {
            return {
                stateName: state.stateName,
                stateCode: state.stateCode,
                salary: salary,
                gender: gender,
                monthlyPTax: 0,
                yearlyPTax: 0,
                applicableSlab: null,
                message: 'No PTax applicable for this state',
                collectionMode: 'N/A',
                breakdown: this.generateBreakdown(0, 0, 'N/A', 'No PTax applicable')
            };
        }

        // Find applicable slab based on salary range (matching C# logic)
        const applicableSlab = this.findMatchingSlab(slabs, salary);

        if (!applicableSlab) {
            return {
                stateName: state.stateName,
                stateCode: state.stateCode,
                salary: salary,
                gender: gender,
                monthlyPTax: 0,
                yearlyPTax: 0,
                applicableSlab: null,
                message: 'No PTax applicable for this salary range',
                collectionMode: 'N/A',
                breakdown: this.generateBreakdown(0, 0, 'N/A', 'Salary below minimum tax threshold')
            };
        }        // Calculate PTax amount using C# logic (matches exactly)
        const currentMonthPTax = this.getPTaxAmount(applicableSlab, date);
        const basePTaxAmount = applicableSlab.PTaxAmt || 0; // Base monthly PTax amount
        const yearlyPTax = this.calculateYearlyPTax(applicableSlab, date);

        return {
            stateName: state.stateName,
            stateCode: state.stateCode,
            salary: salary,
            gender: gender,
            monthlyPTax: basePTaxAmount, // Base PTax amount (what the tax is per collection)
            yearlyPTax: yearlyPTax, // Total yearly amount (sum of all 12 months)
            currentMonthPTax: currentMonthPTax, // Actual amount for current month (0 if not collection month)
            applicableSlab: applicableSlab,
            message: 'PTax calculated successfully',
            collectionMode: applicableSlab.collectionMode,
            breakdown: this.generateBreakdown(basePTaxAmount, yearlyPTax, applicableSlab.collectionMode, applicableSlab)
        };
    }    /**
     * Get valid slabs for a specific state, gender, and date (matches C# caching logic)
     */
    getValidSlabsForDate(stateId, gender, date) {
        const state = this.getStateById(stateId);
        if (!state) return [];

        return this.ptaxSlabs.filter(slab => {
            // Match state
            if (slab.stateGovId !== state.govId) return false;

            // Match gender (prefer exact match, fallback to 'All')
            if (slab.gender !== gender && slab.gender !== 'All') return false;

            // Check date validity (application and expiry dates)
            const applicationDate = this.parseSlabDate(slab.ptaxSessionFromMonth, slab.ptaxFromYear);
            const expiryDate = this.parseSlabDate(slab.ptaxSessionToMonth, slab.ptaxToYear);

            if (applicationDate && date < applicationDate) return false;
            if (expiryDate && date > expiryDate) return false;

            return true;
        });
    }

    /**
     * Parse slab date from month name and year
     */
    parseSlabDate(monthName, year) {
        if (!monthName || !year) return null;

        const monthMap = {
            'JANUARY': 0, 'FEBRUARY': 1, 'MARCH': 2, 'APRIL': 3,
            'MAY': 4, 'JUNE': 5, 'JULY': 6, 'AUGUST': 7,
            'SEPTEMBER': 8, 'OCTOBER': 9, 'NOVEMBER': 10, 'DECEMBER': 11
        };

        const month = monthMap[monthName.toUpperCase()];
        if (month === undefined) return null;

        return new Date(year, month, 1);
    }

    /**
     * Find matching slab based on salary range (matches C# AmtFrom/AmtTo logic)
     */
    findMatchingSlab(slabs, salary) {
        const salaryNum = parseFloat(salary);

        // Prefer gender-specific slabs over 'All' gender slabs
        const sortedSlabs = slabs.sort((a, b) => {
            if (a.gender !== 'All' && b.gender === 'All') return -1;
            if (a.gender === 'All' && b.gender !== 'All') return 1;
            return 0;
        });

        return sortedSlabs.find(slab => {
            const amtFrom = slab.amtFrom || 0;
            const amtTo = slab.amtTo || Number.MAX_SAFE_INTEGER;

            return salaryNum >= amtFrom && salaryNum <= amtTo;
        });
    }    /**
     * Get PTax amount for a slab and date (matches C# GetPTaxAmount logic exactly)
     */
    getPTaxAmount(slab, date) {
        const month = date.getMonth() + 1; // JavaScript months are 0-based

        // Check for override amount for the month (C# OverrideAmountList logic)
        if (slab.overrideAmt) {
            const overrideAmount = this.parseOverrideAmount(slab.overrideAmt, month);
            if (overrideAmount !== null) {
                return overrideAmount;
            }
        }

        // Handle collection mode and collection months (exactly like C# logic)
        if (slab.collectionMode === 'MONTHLY') {
            return slab.PTaxAmt || 0;
        } else {
            // Find collection months for this mode
            const collectionMonths = this.parseCollectionMonths(slab.ptaxCollectionMonth, slab.collectionMode); if (collectionMonths && collectionMonths.includes(month)) {
                switch (slab.collectionMode.toUpperCase()) {
                    case 'YEARLY':
                        return slab.PTaxAmt || 0; // Base amount for yearly collection
                    case 'QUARTERLY':
                        return slab.PTaxAmt || 0; // Base amount per quarter (will be summed up for yearly)
                    case 'HALF YEARLY':
                        return slab.PTaxAmt || 0; // Base amount per half-year (will be summed up for yearly)
                    default:
                        return slab.PTaxAmt || 0;
                }
            }
            // Not a collection month for this mode
            return 0;
        }
    }    /**
     * Parse override amount patterns (supports month-specific overrides)
     * Formats supported:
     * - "2#300" - ₹300 only in month 2 (February), base amount in other months
     * - "2#300;6#450" - ₹300 in month 2, ₹450 in month 6, base amount in other months
     * - "3#250;7#350;12#400" - Multiple month-specific overrides
     */
    parseOverrideAmount(overrideAmt, currentMonth) {
        if (!overrideAmt) return null;

        // Handle simple numeric override
        if (typeof overrideAmt === 'number') {
            return overrideAmt;
        }        // Handle string patterns like "2#300" or "2#300;6#450" (multiple month-specific overrides)
        if (typeof overrideAmt === 'string') {
            if (overrideAmt.includes('#')) {
                // Split by semicolon to handle multiple overrides
                const overrides = overrideAmt.split(';');

                for (const override of overrides) {
                    const parts = override.trim().split('#');
                    if (parts.length === 2) {
                        const overrideMonth = parseInt(parts[0]);
                        const amount = parseFloat(parts[1]);

                        if (currentMonth === overrideMonth) {
                            return amount; // Override amount for this specific month
                        }
                    }
                }

                // No override found for current month, use base amount
                return null;
            }

            // Simple string number
            const amount = parseFloat(overrideAmt);
            return isNaN(amount) ? null : amount;
        }

        return null;
    }

    /**
     * Parse collection months from ptaxCollectionMonth field
     */
    parseCollectionMonths(ptaxCollectionMonth, collectionMode) {
        if (!ptaxCollectionMonth || ptaxCollectionMonth === 'null') {
            // Default monthly collection
            return collectionMode === 'MONTHLY' ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : null;
        }

        // Parse patterns like "Y:10", "H:2,8", "Q:3,6,9,12"
        const parts = ptaxCollectionMonth.split(':');
        if (parts.length !== 2) return null;

        const mode = parts[0];

        const baseMonths = parts[1].split(',').map(m => parseInt(m.trim())); switch (mode.toUpperCase()) {
            case 'Y': // Yearly
                return baseMonths; // Return the specified months directly
            case 'H': // Half-yearly
                return baseMonths; // Return the specified months directly (e.g., "H:2,8" means months 2 and 8)
            case 'Q': // Quarterly
                return baseMonths; // Return the specified months directly (e.g., "Q:3,6,9,12" means months 3,6,9,12)
            default:
                return null;
        }
    }    /**
     * Calculate yearly PTax by summing up all 12 months (proper calculation)
     * This correctly handles different collection modes:
     * - Monthly: Sum of all 12 months
     * - Half-Yearly: Sum of amounts in collection months only (e.g., Feb + Aug)
     * - Quarterly: Sum of amounts in collection months only 
     * - Yearly: Amount in collection month only
     */
    calculateYearlyPTax(slab, baseDate) {
        let yearlyTotal = 0;
        const year = baseDate.getFullYear();

        // Calculate PTax for each month of the year
        for (let month = 1; month <= 12; month++) {
            const monthDate = new Date(year, month - 1, 1); // month - 1 because JS months are 0-based
            const monthlyAmount = this.getPTaxAmount(slab, monthDate);
            yearlyTotal += monthlyAmount;
        }

        return yearlyTotal;
    }

    /**
     * Generate detailed breakdown of PTax calculation
     */
    generateBreakdown(monthlyPTax, yearlyPTax, collectionMode, slab) {
        if (typeof slab === 'string') {
            return {
                monthlyAmount: monthlyPTax,
                yearlyAmount: yearlyPTax,
                collectionMode: collectionMode,
                message: slab,
                installments: []
            };
        }

        const breakdown = {
            monthlyAmount: monthlyPTax,
            yearlyAmount: yearlyPTax,
            collectionMode: collectionMode,
            installments: []
        }; if (slab) {
            breakdown.salaryRange = `₹${slab.amtFrom?.toLocaleString('en-IN')} - ${slab.amtTo ? '₹' + slab.amtTo.toLocaleString('en-IN') : 'Above'}`;
            breakdown.taxSession = `${slab.ptaxSessionFromMonth} ${slab.ptaxFromYear} to ${slab.ptaxSessionToMonth} ${slab.ptaxToYear}`;

            // Add collection month information
            if (slab.ptaxCollectionMonth) {
                const collectionMonths = this.parseCollectionMonths(slab.ptaxCollectionMonth, slab.collectionMode);
                if (collectionMonths) {
                    const monthNames = collectionMonths.map(m => {
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return monthNames[m - 1];
                    });
                    breakdown.collectionMonths = `Collected in: ${monthNames.join(', ')}`;
                }
            }            // For monthly collection mode, always show detailed monthly schedule
            if (collectionMode.toUpperCase() === 'MONTHLY') {
                // Generate monthly schedule (with or without override amounts)
                breakdown.installments = this.generateMonthlySchedule(slab);
            } else {
                // Calculate installment details based on collection mode
                switch (collectionMode.toUpperCase()) {
                    case 'QUARTERLY':
                        breakdown.installments = [
                            { period: 'Quarterly', amount: monthlyPTax, frequency: '4 times per year', description: 'Collected once every 3 months' }
                        ];
                        break;
                    case 'HALF YEARLY':
                        breakdown.installments = [
                            { period: 'Half-Yearly', amount: monthlyPTax, frequency: '2 times per year', description: 'Collected twice per year' }
                        ];
                        break;
                    case 'YEARLY':
                        breakdown.installments = [
                            { period: 'Yearly', amount: monthlyPTax, frequency: '1 time per year', description: 'Collected once per year' }
                        ];
                        break;
                }
            }
        } return breakdown;
    }    /**
     * Generate monthly schedule for monthly collection mode (with or without override amounts)
     */
    generateMonthlySchedule(slab) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const installments = [];
        const basePTaxAmount = slab.PTaxAmt || 0;

        // Derive the month order from slab's session months
        const sessionOrder = this.getSessionMonthOrder(slab.ptaxSessionFromMonth, slab.ptaxSessionToMonth);

        for (const month of sessionOrder) {
            const overrideAmount = this.parseOverrideAmount(slab.overrideAmt, month);
            const amount = overrideAmount !== null ? overrideAmount : basePTaxAmount;

            let amountDisplay = this.formatCurrency(amount);
            let description = '';

            if (overrideAmount !== null && overrideAmount !== basePTaxAmount) {
                description = `Override: ${amountDisplay} (Base: ${this.formatCurrency(basePTaxAmount)})`;
                amountDisplay = `${amountDisplay} *`; // Add asterisk to indicate override
            } else {
                description = 'Base amount';
            }

            installments.push({
                period: monthNames[month - 1],
                amount: amount,
                amountDisplay: amountDisplay,
                frequency: 'Monthly',
                description: description,
                isOverride: overrideAmount !== null && overrideAmount !== basePTaxAmount
            });
        }

        return installments;
    }

    /**
     * Get PTax summary for all states (for comparison)
     */
    getPTaxSummaryForSalary(salary, gender = 'All') {
        const summary = [];

        for (const state of this.states) {
            try {
                const result = this.calculatePTax(state.stateId, salary, gender);
                if (result.monthlyPTax > 0) {
                    summary.push({
                        stateId: state.stateId,
                        stateName: state.stateName,
                        stateCode: state.stateCode,
                        monthlyPTax: result.monthlyPTax,
                        yearlyPTax: result.yearlyPTax,
                        collectionMode: result.collectionMode
                    });
                }
            } catch (error) {
                console.warn(`Error calculating PTax for ${state.stateName}:`, error);
            }
        }

        return summary.sort((a, b) => a.monthlyPTax - b.monthlyPTax);
    }

    /**
     * Format currency for display
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    }    /**
     * Get states with PTax (states that have tax slabs) sorted alphabetically
     */
    getStatesWithPTax() {
        const statesWithPTax = new Set();
        this.ptaxSlabs.forEach(slab => {
            statesWithPTax.add(slab.stateGovId);
        });

        return this.states
            .filter(state => statesWithPTax.has(state.govId))
            .sort((a, b) => a.stateName.localeCompare(b.stateName));
    }

    /**
     * Get collection modes available
     */
    getCollectionModes() {
        const modes = new Set();
        this.ptaxSlabs.forEach(slab => {
            modes.add(slab.collectionMode);
        });
        return Array.from(modes);
    }    /**
     * Get the month order based on session start and end months
     * @param {string} fromMonth - Session start month (e.g., "APRIL")
     * @param {string} toMonth - Session end month (e.g., "MARCH")
     * @returns {number[]} Array of month numbers in session order
     * 
     * Examples:
     * - APRIL to MARCH: [4,5,6,7,8,9,10,11,12,1,2,3] (Financial year)
     * - JANUARY to DECEMBER: [1,2,3,4,5,6,7,8,9,10,11,12] (Calendar year)
     * - JULY to JUNE: [7,8,9,10,11,12,1,2,3,4,5,6] (Different fiscal year)
     */
    getSessionMonthOrder(fromMonth, toMonth) {
        const monthMap = {
            'JANUARY': 1, 'FEBRUARY': 2, 'MARCH': 3, 'APRIL': 4,
            'MAY': 5, 'JUNE': 6, 'JULY': 7, 'AUGUST': 8,
            'SEPTEMBER': 9, 'OCTOBER': 10, 'NOVEMBER': 11, 'DECEMBER': 12
        };

        const startMonth = monthMap[fromMonth?.toUpperCase()] || 4; // Default to April if not found
        const endMonth = monthMap[toMonth?.toUpperCase()] || 3; // Default to March if not found

        const monthOrder = [];

        // If start month is later in year than end month, it crosses year boundary
        if (startMonth > endMonth) {
            // Add months from start month to December
            for (let month = startMonth; month <= 12; month++) {
                monthOrder.push(month);
            }
            // Add months from January to end month
            for (let month = 1; month <= endMonth; month++) {
                monthOrder.push(month);
            }
        } else {
            // Same year, add months from start to end
            for (let month = startMonth; month <= endMonth; month++) {
                monthOrder.push(month);
            }
        }

        return monthOrder;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PTaxCalculator;
}
