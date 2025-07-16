class Roadtrip {
  constructor(countries) {
    this.countries = countries;
    if (!Array.isArray(countries)) {
      throw new TypeError("Countries must be an array");
    }
  }

  addCountry(country) {
    if (!this.countries.includes(country)) {
      this.countries.push(country);
    }
  }

  removeCountry(country) {
    this.countries = this.countries.filter((c) => c !== country);
  }

  getCountries() {
    return this.countries;
  }

  clearCountries() {
    this.countries = [];
  }
}

export default Roadtrip;
