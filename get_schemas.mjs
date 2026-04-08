import 'dotenv/config';
import https from 'https';

const token = process.env.NOTION_TOKEN;

function getDB(id) {
  return new Promise((resolve) => {
    https.get(`https://api.notion.com/v1/databases/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
  });
}

(async () => {
  const personDB = await getDB('e3841003fdc34b9e9d973bd62d39f5bb');
  console.log('PERSON DB PROPERTIES:', Object.keys(personDB.properties || {}));
  if (personDB.properties) {
      console.log('Name prop:', JSON.stringify(personDB.properties['Name']));
      console.log('Todas as props:');
      for (const [key, val] of Object.entries(personDB.properties)) {
          console.log(` - ${key} (${val.type})`);
      }
  } else { console.log(personDB); }
  
  const companyDB = await getDB('696f9f291beb40919f9d93a2de939c45');
  console.log('\nCOMPANY DB PROPERTIES:', Object.keys(companyDB.properties || {}));
  if (companyDB.properties) {
      for (const [key, val] of Object.entries(companyDB.properties)) {
          console.log(` - ${key} (${val.type})`);
      }
  } else { console.log(companyDB); }
})();
