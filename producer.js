//producer.js - this is a Mock Warehouse
// This is a script that generates fake inventory events and pushes them to a Redis queue

require('dotenv').config();

const { createClient } = require('redis');

// Steo 1: connect to Redis
const redisUrl = process.env.REDIS_URL;
const client = createClient({url: redisUrl});

client.on('error', (err) => console.log('Redis Client Error', err));


async function startProducer(){
    //connect to Upstash Redis
    await client.connect();
    console.log('Success... Producer connected to Redis queue');


//Step 2: Simulate warehouse events
const products = [
    {sku: 'WAREHOUSE-001', name: 'Wireless Mouse'}, 
    {sku: 'WAREHOUSE-002', name: 'Mechanical Keyboard'},
    {sku: 'WAREHOUSE-003', name: 'USB-C Hub'},
];

let eventCount = 0;

//Send an event every 3 seconds

const interval = setInterval(async () => {
    //pick a random product
    const product = products[Math.floor(Math.random() * products.length)]; //length of products is 3, Math.random() * products.length creates random number within the range of the length of the products variable i.e. 3, the number is rounded up to a whole number and is inputed as an index in the array to select a product
    
    //generate a random action and quantity
    const actions = ['restock', 'sale', 'return'];
    const action = actions[Math.floor(Math.random() * actions.length)];

    const quantity = Math.floor(Math.random() * 20) + 1;

    //create the payload
    const payload = {
        sku: product.sku,
        name: product.name,
        action: action,
        quantity: quantity,
        timestamp: new Date().toISOString(),
    };

    //Push to Redis queue (using LPUSH to add to the left of the List)
    const queueName = 'inventory_updates';
    await client.lPush(queueName, JSON.stringify(payload));

    eventCount++;
    console.log(` Event ${eventCount} sent: ${product.name} - ${action} ${quantity} units`);

    //after 10 events, it stops (so we don't run the test forever)
    if (eventCount >= 10) {
        clearInterval(interval);
        console.log("Producer finished sending 10 events");
        await client.quit();
        process.exit(0);
    }
}, 3000); // 3000 milliseconds = 3 seconds

}

startProducer();