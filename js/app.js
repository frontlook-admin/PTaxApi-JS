/**
 * PTax Calculator Web Application
 * Main application logic and UI interactions
 */

class PTaxApp {
    constructor() {
        this.calculator = new PTaxCalculator();
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Show loading state
            this.showLoader();

            // Initialize the calculator
            await this.calculator.init();

            // Setup UI components
            this.setupEventListeners();
            this.populateStatesDropdown();
            this.populateStatesSection();

            this.isInitialized = true;
            this.hideLoader();

            console.log('PTax App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize PTax App:', error);
            this.showError('Failed to load application data. Please refresh the page.');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Form submission
        const form = document.getElementById('ptaxForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Salary input formatting
        const salaryInput = document.getElementById('salaryInput');
        if (salaryInput) {
            salaryInput.addEventListener('input', (e) => this.formatSalaryInput(e));
        }

        // State selection change
        const stateSelect = document.getElementById('stateSelect');
        if (stateSelect) {
            stateSelect.addEventListener('change', (e) => this.handleStateChange(e));
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(e) {
        e.preventDefault();

        if (!this.isInitialized) {
            this.showError('Application is still loading. Please wait.');
            return;
        }

        const formData = this.getFormData();
        if (!this.validateFormData(formData)) {
            return;
        }

        try {
            this.showLoadingState();

            // Simulate a small delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500)); const result = this.calculator.calculatePTax(
                formData.stateId,
                formData.salary,
                formData.gender,
                new Date() // Pass current date for accurate calculation
            );

            this.displayResults(result);
            this.hideLoadingState();

        } catch (error) {
            console.error('Error calculating PTax:', error);
            this.showError(`Calculation failed: ${error.message}`);
            this.hideLoadingState();
        }
    }    /**
     * Get form data
     */
    getFormData() {
        const salaryInput = document.getElementById('salaryInput').value;
        // Remove commas and parse the salary
        const salary = parseFloat(salaryInput.replace(/,/g, '')) || 0;

        return {
            stateId: document.getElementById('stateSelect').value,
            salary: salary,
            gender: document.querySelector('input[name="gender"]:checked')?.value || 'Male'
        };
    }    /**
     * Validate form data
     */
    validateFormData(data) {
        if (!data.stateId) {
            this.showError('Please select a state.');
            return false;
        }

        if (data.salary <= 0) {
            this.showError('Please enter a valid salary amount.');
            return false;
        }

        if (data.salary > 999999999) { // About 100 crores
            this.showError('Salary amount seems too high. Please enter a reasonable amount.');
            return false;
        }

        return true;
    }/**
     * Format salary input with commas
     */
    formatSalaryInput(e) {
        let value = e.target.value.replace(/[^0-9]/g, ''); // Remove all non-numeric characters

        if (value) {
            // Limit to reasonable maximum (e.g., 99,99,99,999 - about 100 crores)
            if (value.length > 9) {
                value = value.substring(0, 9);
            }

            // Format with Indian number system (commas)
            const numericValue = parseInt(value);
            if (!isNaN(numericValue)) {
                e.target.value = numericValue.toLocaleString('en-IN');
            }
        } else {
            e.target.value = '';
        }
    }

    /**
     * Handle state selection change
     */
    handleStateChange(e) {
        const stateId = e.target.value;
        if (stateId && this.isInitialized) {
            // Could show state-specific information here
            console.log('Selected state:', stateId);
        }
    }

    /**
     * Populate states dropdown
     */
    populateStatesDropdown() {
        const stateSelect = document.getElementById('stateSelect');
        if (!stateSelect) return;

        // Get states that have PTax
        const statesWithPTax = this.calculator.getStatesWithPTax();

        // Clear existing options except the first one
        stateSelect.innerHTML = '<option value="">Choose a state...</option>';

        // Add states with PTax
        statesWithPTax.forEach(state => {
            const option = document.createElement('option');
            option.value = state.stateId;
            option.textContent = `${state.stateName} (${state.stateCode})`;
            stateSelect.appendChild(option);
        });

        console.log(`Populated dropdown with ${statesWithPTax.length} states with PTax`);
    }

    /**
     * Populate states information section
     */
    populateStatesSection() {
        const statesList = document.getElementById('statesList');
        if (!statesList) return;

        const statesWithPTax = this.calculator.getStatesWithPTax();
        statesList.innerHTML = '';

        statesWithPTax.forEach(state => {
            const stateElement = document.createElement('div');
            stateElement.className = 'col-md-6 col-lg-4';
            stateElement.innerHTML = `
                <button class="state-badge w-100 text-start" 
                        onclick="ptaxApp.selectState(${state.stateId})"
                        title="Click to calculate PTax for ${state.stateName}">
                    <i class="fas fa-map-marker-alt me-2"></i>
                    ${state.stateName}
                    <small class="d-block opacity-75">${state.stateCode}</small>
                </button>
            `;
            statesList.appendChild(stateElement);
        });
    }

    /**
     * Select a state and scroll to calculator
     */
    selectState(stateId) {
        const stateSelect = document.getElementById('stateSelect');
        if (stateSelect) {
            stateSelect.value = stateId;

            // Scroll to calculator section
            const calculatorSection = document.getElementById('calculator');
            if (calculatorSection) {
                calculatorSection.scrollIntoView({ behavior: 'smooth' });

                // Focus on salary input after a short delay
                setTimeout(() => {
                    const salaryInput = document.getElementById('salaryInput');
                    if (salaryInput) {
                        salaryInput.focus();
                    }
                }, 800);
            }
        }
    }

    /**
     * Display calculation results
     */
    displayResults(result) {
        const resultsSection = document.getElementById('resultsSection');
        const resultDetails = document.getElementById('resultDetails');
        const ptaxAmount = document.getElementById('ptaxAmount');
        const breakdownDetails = document.getElementById('breakdownDetails');

        if (!resultsSection || !resultDetails || !ptaxAmount || !breakdownDetails) {
            console.error('Results elements not found');
            return;
        }

        // Update result amount
        ptaxAmount.textContent = this.calculator.formatCurrency(result.monthlyPTax);

        // Update result details
        resultDetails.innerHTML = `
            <p class="mb-1">
                <strong>State:</strong> ${result.stateName} (${result.stateCode})
            </p>
            <p class="mb-1">
                <strong>Salary:</strong> ${this.calculator.formatCurrency(result.salary)} per month
            </p>
            <p class="mb-1">
                <strong>Gender:</strong> ${result.gender}
            </p>
            <p class="mb-0">
                <strong>Collection Mode:</strong> ${result.collectionMode}
            </p>
        `;

        // Update breakdown details
        this.displayBreakdown(result.breakdown, breakdownDetails);

        // Show results with animation
        resultsSection.classList.remove('d-none');
        resultsSection.classList.add('fade-in');

        // Scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
    }

    /**
     * Display tax breakdown
     */
    displayBreakdown(breakdown, container) {
        let html = `
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="breakdown-item">
                        <h6 class="text-primary mb-2">
                            <i class="fas fa-calendar-check me-2"></i>Monthly PTax
                        </h6>
                        <p class="h5 text-success mb-0">
                            ${this.calculator.formatCurrency(breakdown.monthlyAmount)}
                        </p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="breakdown-item">
                        <h6 class="text-primary mb-2">
                            <i class="fas fa-calendar-alt me-2"></i>Yearly PTax
                        </h6>
                        <p class="h5 text-success mb-0">
                            ${this.calculator.formatCurrency(breakdown.yearlyAmount)}
                        </p>
                    </div>
                </div>
            </div>
        `;

        if (breakdown.salaryRange) {
            html += `
                <hr class="my-3">
                <div class="row g-3">
                    <div class="col-md-6">
                        <h6 class="text-primary mb-2">
                            <i class="fas fa-layer-group me-2"></i>Applicable Slab
                        </h6>
                        <p class="mb-0">${breakdown.salaryRange}</p>
                    </div>
                    <div class="col-md-6">
                        <h6 class="text-primary mb-2">
                            <i class="fas fa-clock me-2"></i>Tax Session
                        </h6>
                        <p class="mb-0">${breakdown.taxSession}</p>
                    </div>
                </div>
            `;
        }

        if (breakdown.installments && breakdown.installments.length > 0) {
            html += `
                <hr class="my-3">
                <h6 class="text-primary mb-3">
                    <i class="fas fa-credit-card me-2"></i>Payment Schedule
                </h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead class="table-light">
                            <tr>
                                <th>Period</th>
                                <th>Amount</th>
                                <th>Frequency</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            breakdown.installments.forEach(installment => {
                html += `
                    <tr>
                        <td>${installment.period}</td>
                        <td class="fw-semibold">${this.calculator.formatCurrency(installment.amount)}</td>
                        <td>${installment.frequency}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    /**
     * Show loading state during calculation
     */
    showLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const resultsSection = document.getElementById('resultsSection');
        const errorState = document.getElementById('errorState');

        if (loadingState) loadingState.classList.remove('d-none');
        if (resultsSection) resultsSection.classList.add('d-none');
        if (errorState) errorState.classList.add('d-none');
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) loadingState.classList.add('d-none');
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorState = document.getElementById('errorState');
        const errorMessage = document.getElementById('errorMessage');
        const loadingState = document.getElementById('loadingState');
        const resultsSection = document.getElementById('resultsSection');

        if (errorMessage) errorMessage.textContent = message;
        if (errorState) errorState.classList.remove('d-none');
        if (loadingState) loadingState.classList.add('d-none');
        if (resultsSection) resultsSection.classList.add('d-none');
    }

    /**
     * Show initial loader
     */
    showLoader() {
        // Could add a full-page loader here
        console.log('Loading application...');
    }

    /**
     * Hide initial loader
     */
    hideLoader() {
        console.log('Application loaded successfully');
    }
}

/**
 * API Testing Functions
 */
function testApiEndpoint(endpoint) {
    const examples = {
        states: {
            description: 'Get all Indian states and union territories',
            response: ptaxApp.calculator.getStates().slice(0, 5) // Show first 5 states
        },
        calculate: {
            description: 'Calculate PTax for Assam, ₹25,000 salary, Male',
            response: ptaxApp.calculator.calculatePTax(18, 25000, 'Male')
        },
        slabs: {
            description: 'Get PTax slabs for Assam (State ID: 18)',
            response: ptaxApp.calculator.getPTaxSlabsByStateId(18)
        }
    };

    const example = examples[endpoint];
    if (example) {
        const responseElement = document.getElementById('apiResponseExample');
        if (responseElement) {
            responseElement.innerHTML = `<code class="language-json">${JSON.stringify(example.response, null, 2)}</code>`;
        }
    }
}

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.ptaxApp = new PTaxApp();
        await window.ptaxApp.init();
    } catch (error) {
        console.error('Failed to start PTax App:', error);
    }
});

// Make testApiEndpoint globally available
window.testApiEndpoint = testApiEndpoint;
