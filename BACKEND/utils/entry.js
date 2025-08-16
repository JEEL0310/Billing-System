const axios = require('axios');

// API endpoint
const API_URL = 'http://localhost:5001/api/companies';

// Authentication token (replace with your actual token)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NDU1NzYzMzAyNTZiMjkwOTk0NjgyMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MzQyMzg1MiwiZXhwIjoxNzU2MDE1ODUyfQ.aby2vH-80srdI67s84rddCGQ7QssJ59-efr9SrGvOWY';

// Company data
const companies = [
{ name: 'J.J.NARROW FAB', address: '84-A, AYBIKA IND.SOCIETY-2 UDHANA MAGDALLA ROAD, OPP.GANDHI KUTIR, SURAT', gstNumber: '24AGRPCS920AIZV', mobileNumber: '9876543221' },
{ name: 'Parasmani Jari', address: '1097-1098, Diamond Industrial Park Estate, Sachin, Surat', gstNumber: '24AKLPV3157E120', mobileNumber: '9876543231' },
{ name: 'SRINIVASAN AJANTAA DEVI', address: 'S F No 415, OPP TO SRI RANGANATHAR MATRIC SCHOOL KANUVAI TO VADAVALLI RO, KALAPPANAICKENPALAYAM, Coimbatore, Tamil Nadu, 641108', gstNumber: '33BJHPA8857N1ZR', mobileNumber: '9876543241' }
];

// Function to create a single company
async function createSingleCompany(company) {
  try {
    const response = await axios.post(API_URL, {
      name: company.name,
      address: company.address,
      gstNumber: company.gstNumber,
      mobileNumber: company.mobileNumber,
      companyType: 'Seller'
    }, {
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Success: Created company "${company.name}" (ID: ${response.data._id})`);
    return { success: true, name: company.name, id: response.data._id };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error(`Error creating company "${company.name}": ${errorMessage}`);
    return { success: false, name: company.name, error: errorMessage };
  }
}

// Function to create all companies
async function bulkCreateCompanies() {
  const results = [];
  for (const company of companies) {
    const result = await createSingleCompany(company);
    results.push(result);
  }
  return results;
}

// Execute bulk creation and log summary
async function main() {
  console.log('Starting bulk company creation...');
  const results = await bulkCreateCompanies();

  // Summary
  const successes = results.filter(r => r.success).length;
  const failures = results.filter(r => !r.success);
  console.log('\nBulk Creation Summary:');
  console.log(`Total companies processed: ${results.length}`);
  console.log(`Successful creations: ${successes}`);
  console.log(`Failed creations: ${failures.length}`);
  if (failures.length > 0) {
    console.log('\nFailed companies:');
    failures.forEach(f => console.log(`- ${f.name}: ${f.error}`));
  }
}

main().catch(err => console.error('Unexpected error:', err));