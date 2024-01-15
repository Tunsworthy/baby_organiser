require('dotenv').config();
const axios = require('axios');
const  OpenAIApi  = require('openai');

const SERVER_URL = process.env.SERVER; // Make sure this is set in your environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Make sure this is also set

// Initialize OpenAI client with your API key
const openai = new OpenAIApi({
  apiKey: OPENAI_API_KEY,
});

// ... (rest of your code)


// Function to fetch inventory from the server
async function fetchInventory() {
  try {
    const response = await axios.get(`${SERVER_URL}/api/items/`);
    console.log('Fetched inventory:', response.data);
    return response.data; // should be an array of inventory items
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }
}

// Function to update the inventory after allocating items for menus
async function deductFromInventory(itemId, quantityToDeduct) {
  try {
    await axios.patch(`${SERVER_URL}/api/items/${itemId}`, { quantity: -quantityToDeduct });
    console.log(`Updated inventory item ${itemId}, deducted quantity: ${quantityToDeduct}`);
  } catch (error) {
    console.error('Error updating inventory item', itemId, ':', error);
    throw error;
  }
}

// Helper function to interact with ChatGPT or similar service to generate menu items
async function getMenuItemsFromChatGPT(inventory, rules) {
    console.log("in get menu items from chatGPT")
    console.log(inventory)
    // Format the prompt with inventory and rules
    let prompt = "Generate a menu for lunch and dinner using the following rules and inventory:\n\n";
    prompt += "Rules:\n";
    for (const [key, value] of Object.entries(rules)) {
        prompt += `- ${key}: ${JSON.stringify(value)}\n`;
    }
    prompt += "\nInventory:\n";
    inventory.rows
    .filter(item => item.quantity > 0) // Filters out items with quantity 0
    .forEach(item => {
        prompt += `- ${item.name} - ${item.quantity} available - id ${item.id} - type ${item.type}\n`;
    });

    
    console.log("Prompt")
    console.log(prompt)
    // Add any extra instructions or clarifications needed for GPT-3
    prompt += "\nPlease group the provided inventory items following the below rules";
    
    let jsonString = `[{
        "date": "YYYY-MM-DD",
        "Lunch": {
            "items": [
                {
                    "name": "Example Food",
                    "quantity": 3,
                    "id": 3
                }
            ]
        },
        "Dinner": {
            "items": [
                {
                    "name": "Example Food",
                    "quantity": 3,
                    "id": 3
                }
            ]
        }
    }]`;


    messages = [
        {"role": "system", "content": "You are a helpful assistant that creates a mixture of baby food form the supplied inventory for lunch and dinners, your replay should be output in JSON"},
        {"role": "assistant", "content": jsonString},
        {"role": "user", "content": prompt}
    ];

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        response_format: {"type": "json_object"},
        messages: messages,
        max_tokens: 1500,
        temperature: 0.7
      });
      console.log(response)
      const menuText = response.choices[0].message.content; 
      return menuText; // Return the structured data
  
    } catch (error) {
      console.error('Error generating menu items from ChatGPT:', error);
      throw error;
    }
  }

// Function to generate menus for 7 days and post it back to the server
async function generateAndPostMenus() {
    const date = new Date();

    try {
    const inventory = await fetchInventory();
    const rules = { // Define your rules for Lunch and Dinner.
      Numberofdays: "Generate 5 days",
      Inventory: "The inventory is provided in the format <Item> - <Qty> - <ID) - <TYPE> each line represents a single item",
      Lunch: "Protein/Meat QTY: 2 Vegetables QTY: 3, Each item can only be allocated a maximum of 2 times",
      Dinner: "Protein/Meat QTY: 2 Vegetables QTY: 2, one item can be allocated 2 times, all others can only be allocated once",
      Fruit: "Do not allocate inventory with type fruit",
      FishTwiceAWeek: true,
      Returndateformat: "YYYY-MM-DD",
      CurrentDate: date
    };
    
    let menus = [];
    const menuItems = await getMenuItemsFromChatGPT(inventory, rules);
    //console.log("Received from ChatGPT")
    //console.log(menuItems)
    let menuitemsparse
    menuitemsparse = JSON.parse(menuItems)
    //console.log("parsed JSON", menuitemsparse.menu )

    // Post each menu to the API
    for (const menu of menuitemsparse.menu) {
        console.log("whats meaning posted?")
        console.log(menu)
      await axios.post(`${SERVER_URL}/api/menus`, menu);
    }
    console.log('Menus generated and posted successfully.');
    } catch (error) {
    console.error('Error during generation and posting of menus:', error);
    }
    }
    
    generateAndPostMenus().catch(console.error);
