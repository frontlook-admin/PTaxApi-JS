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
    }

    /**
     * Get all states
     */
    getStates() {
        return this.states.filter(state => !state.isActive); // Filter out inactive states if needed
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
        }

        // Calculate PTax amount using C# logic
        const ptaxAmount = this.getPTaxAmount(applicableSlab, date);
        const monthlyPTax = ptaxAmount;
        const yearlyPTax = this.calculateYearlyPTax(monthlyPTax, applicableSlab.collectionMode);

        return {
            stateName: state.stateName,
            stateCode: state.stateCode,
            salary: salary,
            gender: gender,
            monthlyPTax: monthlyPTax,
            yearlyPTax: yearlyPTax,
            applicableSlab: applicableSlab,
            message: 'PTax calculated successfully',
            collectionMode: applicableSlab.collectionMode,
            breakdown: this.generateBreakdown(monthlyPTax, yearlyPTax, applicableSlab.collectionMode, applicableSlab)
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
    }

    /**
     * Get PTax amount for a slab and date (matches C# GetPTaxAmount logic)
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

        // Handle collection mode and collection months (C# collection logic)
        if (slab.collectionMode === 'MONTHLY') {
            return slab.monthlyPTaxAmt || 0;
        } else {
            // Check if this month is a collection month for the current mode
            const collectionMonths = this.parseCollectionMonths(slab.ptaxCollectionMonth, slab.collectionMode);

            if (collectionMonths && collectionMonths.includes(month)) {
                switch (slab.collectionMode.toUpperCase()) {
                    case 'YEARLY':
                        return slab.monthlyPTaxAmt || 0;
                    case 'QUARTERLY':
                        return (slab.monthlyPTaxAmt || 0) * 3;
                    case 'HALF YEARLY':
                        return (slab.monthlyPTaxAmt || 0) * 6;
                    default:
                        return slab.monthlyPTaxAmt || 0;
                }
            }

            // Not a collection month for this mode
            return 0;
        }
    }

    /**
     * Parse override amount patterns (supports month-specific overrides)
     */
    parseOverrideAmount(overrideAmt, currentMonth) {
        if (!overrideAmt) return null;

        // Handle simple numeric override
        if (typeof overrideAmt === 'number') {
            return overrideAmt;
        }

        // Handle string patterns like "2#300" (meaning ₹300 from 2nd month onwards)
        if (typeof overrideAmt === 'string') {
            if (overrideAmt.includes('#')) {
                const parts = overrideAmt.split('#');
                if (parts.length === 2) {
                    const fromMonth = parseInt(parts[0]);
                    const amount = parseFloat(parts[1]);

                    if (currentMonth >= fromMonth) {
                        return amount;
                    }
                    return 0; // Before the override month
                }
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

        // Parse patterns like "Y:10", "H:2", "Q:3"
        const parts = ptaxCollectionMonth.split(':');
        if (parts.length !== 2) return null;

        const mode = parts[0];
        const baseMonth = parseInt(parts[1]);

        switch (mode.toUpperCase()) {
            case 'Y': // Yearly
                return [baseMonth];
            case 'H': // Half-yearly
                return [baseMonth, baseMonth + 6].map(m => m > 12 ? m - 12 : m);
            case 'Q': // Quarterly
                return [baseMonth, baseMonth + 3, baseMonth + 6, baseMonth + 9]
                    .map(m => m > 12 ? m - 12 : m);
            default:
                return null;
        }
    }    /**
     * Calculate yearly PTax based on collection mode (matches C# logic)
     */
    calculateYearlyPTax(monthlyPTax, collectionMode) {
        switch (collectionMode.toUpperCase()) {
            case 'MONTHLY':
                return monthlyPTax * 12;
            case 'YEARLY':
                return monthlyPTax; // Single yearly payment
            case 'QUARTERLY':
                return monthlyPTax * 4; // 4 quarterly payments
            case 'HALF YEARLY':
                return monthlyPTax * 2; // 2 half-yearly payments
            default:
                return monthlyPTax * 12;
        }
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
        };

        if (slab) {
            breakdown.salaryRange = `₹${slab.amtFrom?.toLocaleString('en-IN')} - ${slab.amtTo ? '₹' + slab.amtTo.toLocaleString('en-IN') : 'Above'}`;
            breakdown.taxSession = `${slab.ptaxSessionFromMonth} ${slab.ptaxFromYear} to ${slab.ptaxSessionToMonth} ${slab.ptaxToYear}`;

            // Calculate installment details based on collection mode
            switch (collectionMode.toUpperCase()) {
                case 'MONTHLY':
                    breakdown.installments = [
                        { period: 'Monthly', amount: monthlyPTax, frequency: '12 times per year' }
                    ];
                    break;
                case 'QUARTERLY':
                    breakdown.installments = [
                        { period: 'Quarterly', amount: monthlyPTax, frequency: '4 times per year' }
                    ];
                    break;
                case 'HALF YEARLY':
                    breakdown.installments = [
                        { period: 'Half-Yearly', amount: monthlyPTax, frequency: '2 times per year' }
                    ];
                    break;
                case 'YEARLY':
                    breakdown.installments = [
                        { period: 'Yearly', amount: yearlyPTax, frequency: '1 time per year' }
                    ];
                    break;
            }
        }

        return breakdown;
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
    }

    /**
     * Get states with PTax (states that have tax slabs)
     */
    getStatesWithPTax() {
        const statesWithPTax = new Set();
        this.ptaxSlabs.forEach(slab => {
            statesWithPTax.add(slab.stateGovId);
        });

        return this.states.filter(state => statesWithPTax.has(state.govId));
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
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PTaxCalculator;
}
