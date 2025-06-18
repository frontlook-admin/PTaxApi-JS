/**
 * Convert CSV data to JSON format for PTax Calculator
 */

const fs = require('fs');
const path = require('path');

// Raw CSV data
const statesCSV = `StateId,StateName,StateCode,CountryId,GovId,IsUT,IsActive
1,Jammu and Kashmir,JK,1,1,1,0
2,Himachal Pradesh,HP,1,2,0,0
3,Punjab,PB,1,3,0,0
4,Chandigarh,CH,1,4,1,0
5,Uttarakhand,UA,1,5,0,0
6,Haryana,HR,1,6,0,0
7,Delhi,DL,1,7,1,0
8,Rajasthan,RJ,1,8,0,0
9,Uttar Pradesh,UP,1,9,0,0
10,Bihar,BR,1,10,0,0
11,Sikkim,SK,1,11,0,0
12,Arunachal Pradesh,AR,1,12,0,0
13,Nagaland,NL,1,13,0,0
14,Manipur,MN,1,14,0,0
15,Mizoram,MZ,1,15,0,0
16,Tripura,TR,1,16,0,0
17,Meghalaya,ML,1,17,0,0
18,Assam,AS,1,18,0,0
19,West Bengal,WB,1,19,0,0
20,Jharkhand,JH,1,20,0,0
21,Odisha,OR,1,21,0,0
22,Chhattisgarh,CG,1,22,0,0
23,Madhya Pradesh,MP,1,23,0,0
24,Gujarat,GJ,1,24,0,0
25,Daman and Diu,DD,1,25,1,0
26,Dadra and Nagar Haveli,DNHDD,1,26,1,0
27,Maharashtra,MH,1,27,0,0
28,Karnataka,KA,1,29,0,0
29,Goa,GA,1,30,0,0
30,Lakshadweep,LD,1,31,1,0
31,Kerala,KL,1,32,0,0
32,Tamil Nadu,TN,1,33,0,0
33,Puducherry,PY,1,34,1,0
34,Andaman and Nicobar Islands,AN,1,35,1,0
35,Telangana,TS,1,36,0,0
36,Andhra Pradesh,AP,1,37,0,0
37,Ladakh,LA,1,38,1,0
38,Other Territory,0T,1,97,1,0
39,Other Country,0C,1,98,1,0`;

const ptaxCSV = `STATE_GOV_ID,State Name,Amt From (Per Month),Amt To (Per Month),Monthly P Tax Amt,Override Amt,Collection Mode (Yearly/HalfYearly/Quaterly/Monthly),PTax Collection Month,Gender,P Tax Session From (Month),P Tax Session To (Month),P Tax From Year,P Tax To Year
12,Arunachal Pradesh,15001,20000,150, ,MONTHLY,,All,APRIL,MARCH,2025,2026
12,Arunachal Pradesh,20001, ,200,,MONTHLY,,All,APRIL,MARCH,2025,2026
18,Assam,10001,15000,150,,MONTHLY,,All,APRIL,MARCH,2025,2026
18,Assam,15001,25000,180,,MONTHLY,,All,APRIL,MARCH,2025,2026
18,Assam,25001, ,208,,MONTHLY,,All,APRIL,MARCH,2025,2026
10,BIHAR,300001,500000,1000,,YEARLY,Y:10,All,APRIL,MARCH,2025,2026
10,BIHAR,500001,1000000,2000,,YEARLY,Y:10,All,APRIL,MARCH,2025,2026
10,BIHAR,1000001, ,2500,,YEARLY,Y:10,All,APRIL,MARCH,2025,2026
22,Chhattisgarh,40001,50000,30,,MONTHLY,,All,APRIL,MARCH,2025,2026
22,Chhattisgarh,50001,60000,60,,MONTHLY,,All,APRIL,MARCH,2025,2026
22,Chhattisgarh,60001,80000,90,,MONTHLY,,All,APRIL,MARCH,2025,2026
22,Chhattisgarh,80001,100000,100,,MONTHLY,,All,APRIL,MARCH,2025,2026
22,Chhattisgarh,100001,150000,120,,MONTHLY,,All,APRIL,MARCH,2025,2026
22,Chhattisgarh,150001,200000,150,,MONTHLY,,All,APRIL,MARCH,2025,2026
22,Chhattisgarh,200001,250000,180,,MONTHLY,,All,APRIL,MARCH,2025,2026
22,Chhattisgarh,250001,300000,190,,MONTHLY,,All,APRIL,MARCH,2025,2026
22,Chhattisgarh,300001,,200,,MONTHLY,,All,APRIL,MARCH,2025,2026
24,GUJARAT,12001,,200,,MONTHLY,,All,APRIL,MARCH,2025,2026
20,JHARKHAND,300001,500000,1200,,YEARLY,Y:6,All,APRIL,MARCH,2025,2026
20,JHARKHAND,500001,800000,1800,,YEARLY,Y:6,All,APRIL,MARCH,2025,2026
20,JHARKHAND,800001,1000000,2100,,YEARLY,Y:6,All,APRIL,MARCH,2025,2026
20,JHARKHAND,1000001,,2500,,YEARLY,Y:6,All,APRIL,MARCH,2025,2026
29,KARNATAKA,25000,,200,2#300,MONTHLY,,All,APRIL,MARCH,2025,2026
32,KERALA,12000,17999,320,,HALF YEARLY,H:2,8,All,APRIL,MARCH,2025,2026
32,KERALA,18000,29999,450,,HALF YEARLY,H:2,8,All,APRIL,MARCH,2025,2026
32,KERALA,30000,44999,600,,HALF YEARLY,H:2,8,All,APRIL,MARCH,2025,2026
32,KERALA,45000,99999,750,,HALF YEARLY,H:2,8,All,APRIL,MARCH,2025,2026
32,KERALA,100000,124999,1000,,HALF YEARLY,H:2,8,All,APRIL,MARCH,2025,2026
32,KERALA,125000,,1250,,HALF YEARLY,H:2,8,All,APRIL,MARCH,2025,2026
23,Madhya Pradesh,225001,300000,125, ,MONTHLY,,All,APRIL,MARCH,2025,2026
23,Madhya Pradesh,300001,400000,166,3#174,MONTHLY,,All,APRIL,MARCH,2025,2026
23,Madhya Pradesh,400001,,208,2#212,MONTHLY,,All,APRIL,MARCH,2025,2026
27,Maharashtra,7501,10000,175,,MONTHLY,,Male,APRIL,MARCH,2025,2026
27,Maharashtra,10001,,200,2#300,MONTHLY,,Male,APRIL,MARCH,2025,2026
27,Maharashtra,25001,,200,2#300,MONTHLY,,Female,APRIL,MARCH,2025,2026
14,MANIPUR,4251,6250,100,,MONTHLY,,All,APRIL,MARCH,2025,2026
14,MANIPUR,6351,8333,167,,MONTHLY,,All,APRIL,MARCH,2025,2026
14,MANIPUR,8334,10416,200,,MONTHLY,,All,APRIL,MARCH,2025,2026
14,MANIPUR,10417,,208,3#212,MONTHLY,,All,APRIL,MARCH,2025,2026
17,Meghalaya,50001,75000,200,,MONTHLY,,All,APRIL,MARCH,2025,2026
17,Meghalaya,75001,100000,300,,MONTHLY,,All,APRIL,MARCH,2025,2026
17,Meghalaya,100001,150000,500,,MONTHLY,,All,APRIL,MARCH,2025,2026
17,Meghalaya,150001,200000,750,,MONTHLY,,All,APRIL,MARCH,2025,2026
17,Meghalaya,200001,250000,1000,,MONTHLY,,All,APRIL,MARCH,2025,2026
17,Meghalaya,250001,300000,1250,,MONTHLY,,All,APRIL,MARCH,2025,2026
17,Meghalaya,300001,350000,1500,,MONTHLY,,All,APRIL,MARCH,2025,2026
17,Meghalaya,350001,400000,1800,,MONTHLY,,All,APRIL,MARCH,2025,2026
17,Meghalaya,400001,450000,2100,,MONTHLY,,All,APRIL,MARCH,2025,2026
17,Meghalaya,450001,500000,2400,,MONTHLY,,All,APRIL,MARCH,2025,2026
17,Meghalaya,500001,,2500,,MONTHLY,,All,APRIL,MARCH,2025,2026
15,Mizoram,5001,8000,75,,MONTHLY,,All,APRIL,MARCH,2025,2026
15,Mizoram,8001,10000,120,,MONTHLY,,All,APRIL,MARCH,2025,2026
15,Mizoram,10001,12000,150,,MONTHLY,,All,APRIL,MARCH,2025,2026
15,Mizoram,12001,15000,180,,MONTHLY,,All,APRIL,MARCH,2025,2026
15,Mizoram,15001,20000,195,,MONTHLY,,All,APRIL,MARCH,2025,2026
15,Mizoram,20001,1000000000,208,,MONTHLY,,All,APRIL,MARCH,2025,2026
13,Nagaland,4001,5000,35,,MONTHLY,,All,APRIL,MARCH,2025,2026
13,Nagaland,5001,7000,75,,MONTHLY,,All,APRIL,MARCH,2025,2026
13,Nagaland,7001,9000,110,,MONTHLY,,All,APRIL,MARCH,2025,2026
13,Nagaland,9001,12000,180,,MONTHLY,,All,APRIL,MARCH,2025,2026
13,Nagaland,12001,,208,,MONTHLY,,All,APRIL,MARCH,2025,2026
21,ODISHA,160001,300000,125,,MONTHLY,,All,APRIL,MARCH,2025,2026
21,ODISHA,300001,,200,3#300,MONTHLY,,All,APRIL,MARCH,2025,2026
34,Puducherry,100000,200000,250,,MONTHLY,,All,APRIL,MARCH,2025,2026
34,Puducherry,200001,300000,500,,MONTHLY,,All,APRIL,MARCH,2025,2026
34,Puducherry,300001,400000,750,,MONTHLY,,All,APRIL,MARCH,2025,2026
34,Puducherry,400001,500000,1000,,MONTHLY,,All,APRIL,MARCH,2025,2026
34,Puducherry,500001,,1250,,MONTHLY,,All,APRIL,MARCH,2025,2026
3,Punjab,250000,,200,,MONTHLY,,All,APRIL,MARCH,2025,2026
11,Sikkim,20001,30000,125,,MONTHLY,,All,APRIL,MARCH,2025,2026
11,Sikkim,30001,40000,150,,MONTHLY,,All,APRIL,MARCH,2025,2026
11,Sikkim,40001,,200,,MONTHLY,,All,APRIL,MARCH,2025,2026
33,Tamil Nadu,21001,30000,135,,MONTHLY,,All,APRIL,MARCH,2025,2026
33,Tamil Nadu,30001,45000,315,,MONTHLY,,All,APRIL,MARCH,2025,2026
33,Tamil Nadu,45001,60000,690,,MONTHLY,,All,APRIL,MARCH,2025,2026
33,Tamil Nadu,60001,75000,1025,,MONTHLY,,All,APRIL,MARCH,2025,2026
33,Tamil Nadu,75001,,1250,,MONTHLY,,All,APRIL,MARCH,2025,2026
36,Telangana,15001,20000,150,,MONTHLY,,All,APRIL,MARCH,2025,2026
36,Telangana,20001,,200,,MONTHLY,,All,APRIL,MARCH,2025,2026
16,TRIPURA,7501,15000,150,,MONTHLY,,All,APRIL,MARCH,2025,2026
16,TRIPURA,15001,,208,,MONTHLY,,All,APRIL,MARCH,2025,2026
19,West Bengal,10001,15000,110,,MONTHLY,,All,APRIL,MARCH,2025,2026
19,West Bengal,15001,25000,130,,MONTHLY,,All,APRIL,MARCH,2025,2026
19,West Bengal,25001,40000,150,,MONTHLY,,All,APRIL,MARCH,2025,2026
19,West Bengal,40001,,180,,MONTHLY,,All,APRIL,MARCH,2025,2026
9,Uttar Pradesh,7501,10000,175,,MONTHLY,,All,APRIL,MARCH,2025,2026
9,Uttar Pradesh,10001,,200,2#300,MONTHLY,,All,APRIL,MARCH,2025,2026
5,UTTARAKHAND,7501,10000,175,,MONTHLY,,All,APRIL,MARCH,2025,2026
5,UTTARAKHAND,10001,,200,2#300,MONTHLY,,All,APRIL,MARCH,2025,2026
1,Jammu and Kashmir,7501,10000,175,,MONTHLY,,All,APRIL,MARCH,2025,2026
1,Jammu and Kashmir,10001,,200,2#300,MONTHLY,,All,APRIL,MARCH,2025,2026
30,GOA,7501,10000,175,,MONTHLY,,All,APRIL,MARCH,2025,2026
30,GOA,10001,,200,2#300,MONTHLY,,All,APRIL,MARCH,2025,2026
12,Arunachal Pradesh,7501,10000,175,,MONTHLY,,All,APRIL,MARCH,2025,2026
12,Arunachal Pradesh,10001,,200,2#300,MONTHLY,,All,APRIL,MARCH,2025,2026
7,DELHI,50001,75000,100,,MONTHLY,,All,APRIL,MARCH,2025,2026
7,DELHI,75001,100000,150,,MONTHLY,,All,APRIL,MARCH,2025,2026
7,DELHI,100001,,200,,MONTHLY,,All,APRIL,MARCH,2025,2026
2,HIMACHAL PRADESH,7501,10000,175,,MONTHLY,,All,APRIL,MARCH,2025,2026
2,HIMACHAL PRADESH,10001,,200,2#300,MONTHLY,,All,APRIL,MARCH,2025,2026`;

function parseCSV(csvData) {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const obj = {};

        for (let j = 0; j < headers.length; j++) {
            let value = values[j]?.trim() || '';

            // Handle quoted values
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }

            // Convert numeric values
            if (!isNaN(value) && value !== '') {
                obj[headers[j]] = parseInt(value) || parseFloat(value);
            } else {
                obj[headers[j]] = value || null;
            }
        }

        result.push(obj);
    }

    return result;
}

function convertStates() {
    const states = parseCSV(statesCSV);
    const convertedStates = states.map(state => ({
        stateId: state.StateId,
        stateName: state.StateName,
        stateCode: state.StateCode,
        countryId: state.CountryId,
        govId: state.GovId,
        isUT: state.IsUT === 1,
        isActive: state.IsActive === 1
    }));

    return convertedStates;
}

function convertPTaxSlabs() {
    const ptaxData = parseCSV(ptaxCSV);
    const convertedSlabs = ptaxData.map(slab => ({
        stateGovId: slab.STATE_GOV_ID,
        stateName: slab['State Name'],
        amtFrom: slab['Amt From (Per Month)'] || null,
        amtTo: slab['Amt To (Per Month)'] || null,
        monthlyPTaxAmt: slab['Monthly P Tax Amt'],
        overrideAmt: slab['Override Amt'] || null,
        collectionMode: slab['Collection Mode (Yearly/HalfYearly/Quaterly/Monthly)'],
        ptaxCollectionMonth: slab['PTax Collection Month'] || null,
        gender: slab.Gender,
        ptaxSessionFromMonth: slab['P Tax Session From (Month)'],
        ptaxSessionToMonth: slab['P Tax Session To (Month)'],
        ptaxFromYear: slab['P Tax From Year'],
        ptaxToYear: slab['P Tax To Year']
    }));

    return convertedSlabs;
}

// Convert and save data
try {
    const states = convertStates();
    const ptaxSlabs = convertPTaxSlabs();

    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write states data
    fs.writeFileSync(
        path.join(dataDir, 'states.json'),
        JSON.stringify(states, null, 2),
        'utf8'
    );

    // Write PTax slabs data
    fs.writeFileSync(
        path.join(dataDir, 'ptax-slabs.json'),
        JSON.stringify(ptaxSlabs, null, 2),
        'utf8'
    );

    console.log('✅ Data conversion completed successfully!');
    console.log(`✅ Converted ${states.length} states`);
    console.log(`✅ Converted ${ptaxSlabs.length} PTax slabs`);

    // Validate JSON files
    const statesData = JSON.parse(fs.readFileSync(path.join(dataDir, 'states.json'), 'utf8'));
    const slabsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'ptax-slabs.json'), 'utf8'));

    console.log('✅ JSON validation successful');
    console.log(`✅ States file: ${statesData.length} records`);
    console.log(`✅ PTax slabs file: ${slabsData.length} records`);

} catch (error) {
    console.error('❌ Error during conversion:', error);
    process.exit(1);
}
