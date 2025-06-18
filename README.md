# PTax Calculator - JavaScript Version

A client-side JavaScript implementation of the Professional Tax Calculator for Indian states. This version can be deployed to GitHub Pages and runs entirely in the browser without requiring a backend server.

## 🌟 Features

- **📱 Client-Side Calculation**: Runs entirely in the browser
- **🚀 GitHub Pages Ready**: Deploy to GitHub Pages with zero configuration
- **🌍 39 States & UTs**: Complete coverage of Indian states and union territories
- **💰 100+ Tax Slabs**: Comprehensive PTax rules and calculations
- **👥 Gender-Specific Rules**: Different tax slabs for male/female employees
- **📅 Multiple Collection Modes**: Monthly, Quarterly, Half-Yearly, and Yearly
- **📱 Responsive Design**: Mobile-friendly interface
- **⚡ Fast Performance**: Instant calculations with local data

## 🎯 Live Demo

Visit the live calculator: **[https://frontlook-admin.github.io/PTaxApi-JS/](https://frontlook-admin.github.io/PTaxApi-JS/)**

## 🚀 Quick Start

### Option 1: Use the Live Version
Simply visit the live demo link above - no installation required!

### Option 2: Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/frontlook-admin/PTaxApi-JS.git
   cd PTaxApi-JS
   ```

2. **Install dependencies** (optional, for development)
   ```bash
   npm install
   ```

3. **Start local server**
   ```bash
   # Using npm (if you installed dependencies)
   npm start
   
   # Or using Python (if you have Python installed)
   python -m http.server 3000
   
   # Or simply open index.html in your browser
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
PTaxApi-JS/
├── index.html              # Main HTML file
├── css/
│   └── style.css           # Custom styles
├── js/
│   ├── ptax-calculator.js  # Core calculation engine
│   └── app.js              # UI application logic
├── data/
│   ├── states.json         # Indian states data
│   └── ptax-slabs.json     # PTax rules and slabs
├── package.json            # Project configuration
└── README.md              # This file
```

## 💻 Usage Examples

### Basic PTax Calculation

```javascript
// Initialize calculator
const calculator = new PTaxCalculator();
await calculator.init();

// Calculate PTax for Assam, ₹25,000 salary, Male
const result = calculator.calculatePTax(18, 25000, 'Male');
console.log(result);
// Output: { monthlyPTax: 180, yearlyPTax: 2160, ... }
```

### Get All States

```javascript
const states = calculator.getStates();
console.log(states.length); // 39 states and UTs
```

### Get PTax Slabs for a State

```javascript
const slabs = calculator.getPTaxSlabsByStateId(18); // Assam
console.log(slabs);
```

## 🔧 API Reference

### PTaxCalculator Class

#### Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `init()` | Initialize calculator with data | None | Promise |
| `calculatePTax(stateId, salary, gender)` | Calculate PTax | stateId, salary, gender | Object |
| `getStates()` | Get all states | None | Array |
| `getPTaxSlabsByStateId(stateId)` | Get tax slabs for state | stateId | Array |
| `getStatesWithPTax()` | Get states with PTax | None | Array |

#### Calculate PTax Response

```javascript
{
  stateName: "Assam",
  stateCode: "AS",
  salary: 25000,
  gender: "Male",
  monthlyPTax: 180,
  yearlyPTax: 2160,
  collectionMode: "MONTHLY",
  applicableSlab: { ... },
  breakdown: { ... }
}
```

## 🚀 Deployment to GitHub Pages

1. **Fork this repository** or create your own

2. **Enable GitHub Pages**
   - Go to repository Settings
   - Scroll to Pages section
   - Source: Deploy from branch
   - Branch: main (or master)
   - Folder: / (root)

3. **Your calculator will be live at:**
   ```
   https://yourusername.github.io/PTaxApi-JS/
   ```

## 🔄 Updating Data

The PTax data is stored in JSON files in the `data/` directory:

- `states.json` - Indian states and union territories
- `ptax-slabs.json` - PTax rules and tax slabs

To update the data:

1. Edit the JSON files
2. Commit and push changes
3. GitHub Pages will automatically update

## 🎨 Customization

### Styling
Edit `css/style.css` to customize the appearance:

```css
:root {
    --primary-color: #0066cc;
    --secondary-color: #ffc107;
    /* ... other custom properties */
}
```

### Functionality
Extend the calculator by modifying:

- `js/ptax-calculator.js` - Core calculation logic
- `js/app.js` - UI interactions and display

## 📱 Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers

## 🔍 SEO Features

- Semantic HTML structure
- Open Graph meta tags
- Descriptive page titles
- Mobile-responsive design
- Fast loading times

## 🐛 Troubleshooting

### Calculator Not Loading
- Check browser console for errors
- Ensure you're serving the files via HTTP (not file://)
- Verify JSON files are accessible

### Incorrect Calculations
- Check the data in `ptax-slabs.json`
- Verify state ID mapping in `states.json`
- Review calculation logic in `ptax-calculator.js`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- **[PTaxApi (.NET)](https://github.com/frontlook-admin/PTaxApi)** - Backend API version
- **[PTax Documentation](https://github.com/frontlook-admin/PTaxApi/blob/main/README.md)** - Comprehensive documentation

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/frontlook-admin/PTaxApi-JS/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/frontlook-admin/PTaxApi-JS/discussions)
- 📧 **Email**: Create an issue for support

## ⭐ Show Your Support

If this project helps you, please give it a ⭐ on GitHub!

---

**Built with ❤️ for the Indian developer community**
