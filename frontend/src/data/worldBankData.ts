// Simulated EDA data from World Bank DataBank
// https://databank.worldbank.org

export const rdExpenditureByCountry = [
  { country: "Israel", expenditure: 5.44, gdp: 522 },
  { country: "S. Korea", expenditure: 4.81, gdp: 1811 },
  { country: "Sweden", expenditure: 3.53, gdp: 635 },
  { country: "Japan", expenditure: 3.26, gdp: 4231 },
  { country: "Germany", expenditure: 3.14, gdp: 4259 },
  { country: "USA", expenditure: 3.46, gdp: 25462 },
  { country: "Finland", expenditure: 2.94, gdp: 301 },
  { country: "Denmark", expenditure: 2.81, gdp: 399 },
  { country: "China", expenditure: 2.43, gdp: 17963 },
  { country: "France", expenditure: 2.22, gdp: 2937 },
  { country: "UK", expenditure: 1.71, gdp: 3158 },
  { country: "India", expenditure: 0.65, gdp: 3385 },
];

export const globalIndicatorsTrend = [
  { year: 2010, rdSpending: 1.97, researchers: 5812, patents: 1890, sciPublications: 1620 },
  { year: 2011, rdSpending: 2.02, researchers: 5934, patents: 2010, sciPublications: 1710 },
  { year: 2012, rdSpending: 2.07, researchers: 6123, patents: 2150, sciPublications: 1820 },
  { year: 2013, rdSpending: 2.11, researchers: 6298, patents: 2280, sciPublications: 1950 },
  { year: 2014, rdSpending: 2.15, researchers: 6489, patents: 2410, sciPublications: 2090 },
  { year: 2015, rdSpending: 2.19, researchers: 6712, patents: 2580, sciPublications: 2250 },
  { year: 2016, rdSpending: 2.24, researchers: 6934, patents: 2730, sciPublications: 2430 },
  { year: 2017, rdSpending: 2.31, researchers: 7198, patents: 2920, sciPublications: 2640 },
  { year: 2018, rdSpending: 2.38, researchers: 7456, patents: 3150, sciPublications: 2890 },
  { year: 2019, rdSpending: 2.44, researchers: 7723, patents: 3340, sciPublications: 3120 },
  { year: 2020, rdSpending: 2.51, researchers: 7934, patents: 3210, sciPublications: 3450 },
  { year: 2021, rdSpending: 2.59, researchers: 8201, patents: 3520, sciPublications: 3780 },
  { year: 2022, rdSpending: 2.68, researchers: 8467, patents: 3740, sciPublications: 4120 },
  { year: 2023, rdSpending: 2.73, researchers: 8712, patents: 3890, sciPublications: 4450 },
];

export const regionDistribution = [
  { region: "East Asia & Pacific", rdPercent: 2.41, papers: 34.2, researchers: 42.1 },
  { region: "North America", rdPercent: 3.12, papers: 22.8, researchers: 18.4 },
  { region: "Europe & Central Asia", rdPercent: 2.03, papers: 28.6, researchers: 25.3 },
  { region: "South Asia", rdPercent: 0.72, papers: 7.2, researchers: 6.8 },
  { region: "Latin America", rdPercent: 0.68, papers: 4.1, researchers: 4.2 },
  { region: "Middle East & N. Africa", rdPercent: 1.12, papers: 2.3, researchers: 2.4 },
  { region: "Sub-Saharan Africa", rdPercent: 0.42, papers: 0.8, researchers: 0.8 },
];

export const worldBankStats = {
  totalCountries: 217,
  countriesWithRD: 148,
  yearsOfData: 63,
  totalIndicators: 1443,
  avgGlobalRD: 2.63,
  missingDataPercent: 34.2,
  topGrowthRegion: "East Asia",
  dataFormats: ["CSV", "Excel", "JSON", "XML"],
};

export const scienceOutputByIncome = [
  { group: "High Income", publications: 72.4, patents: 89.2, rdSpending: 82.1 },
  { group: "Upper Middle", publications: 21.3, patents: 8.6, rdSpending: 14.2 },
  { group: "Lower Middle", publications: 5.8, patents: 1.9, rdSpending: 3.4 },
  { group: "Low Income", publications: 0.5, patents: 0.3, rdSpending: 0.3 },
];
