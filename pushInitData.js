var admin = require("firebase-admin");
var serviceAccount = require("./key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firestore = admin.firestore();

// Data to push
const data = [];
function getRandomValue() {
    return Math.floor(Math.random() * 7) + 1; // generates a random number between 1 and 7
}

// Loop for Level2
for (let row = 1; row <= 10; row++) {
    for (let col = 'A'; col <= 'D'; col = String.fromCharCode(col.charCodeAt(0) + 1)) {
        const cell = col + row;
        data.push({ level: 'Level2', cell: cell, value: getRandomValue() });
    }
}

// Loop for Level3
for (let row = 1; row <= 10; row++) {
    for (let col = 'A'; col <= 'D'; col = String.fromCharCode(col.charCodeAt(0) + 1)) {
        const cell = col + row;
        data.push({ level: 'Level3', cell: cell, value: getRandomValue() });
    }
}
// // Loop for Level2
// for (let row = 1; row <= 10; row++) {
    
//     for (let col = 'A'; col <= 'A'; col++) {
//         const cell = col + row;
//         data.push({ level: 'Level2', cell: cell, value: 7 });
//     }
    
//     for (let col = 'B'; col <= 'B'; col++) {
//         const cell = col + row;
//         data.push({ level: 'Level2', cell: cell, value: 7 });
//     }
    
//     for (let col = 'C'; col <= 'C'; col++) {
//         const cell = col + row;
//         data.push({ level: 'Level2', cell: cell, value: 7 });
//     }
//     for (let col = 'D'; col <= 'D'; col++) {
//         const cell = col + row;
//         data.push({ level: 'Level2', cell: cell, value: 7 });
//     }
// }

// // Loop for Level3
// for (let row = 1; row <= 10; row++) {
    
//     for (let col = 'A'; col <= 'A'; col++) {
//         const cell = col + row;
//         data.push({ level: 'Level3', cell: cell, value: 7 });
//     }
    
//     for (let col = 'B'; col <= 'B'; col++) {
//         const cell = col + row;
//         data.push({ level: 'Level3', cell: cell, value: 7 });
//     }
    
//     for (let col = 'C'; col <= 'C'; col++) {
//         const cell = col + row;
//         data.push({ level: 'Level3', cell: cell, value: 7 });
//     }
//     for (let col = 'D'; col <= 'D'; col++) {
//         const cell = col + row;
//         data.push({ level: 'Level3', cell: cell, value: 7 });
//     }
// }

data.forEach((item) => {
    const { level, cell, value } = item;
    const [column, row] = cell.split('');

    firestore.collection(level).doc(cell).set({ value: value })
        .then(() => {
            console.log(`Document ${level} -> ${cell} successfully written!`);
        })
        .catch((error) => {
            console.error(`Error writing document ${level} -> ${cell}: `, error);
        });
});
