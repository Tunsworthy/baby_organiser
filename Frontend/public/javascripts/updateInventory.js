function updateInventory(button) {
    const itemId = button.getAttribute('data-item-id');
    const quantity = parseInt(button.getAttribute('data-quantity'), 10);
    const itemName = button.getAttribute('data-item-name');
    const mealType = button.getAttribute('data-meal-type'); // Getting the meal type from the button's data attribute
    const buttonType = button.getAttribute('name')
    console.log(buttonType)
    // Query the document for the active page item link and extract the date
    const currentDateElement = document.querySelector('.page-item.active .page-link');
    const currentDateHref = currentDateElement.getAttribute('href');
    const currentDateMatch = currentDateHref.match(/\d{4}-\d{2}-\d{2}/);
    const currentDate = new Date(currentDateMatch[0]).toISOString();
    
    switch(buttonType){
        case "allocate":
            allocate(itemId,quantity,currentDate,mealType,button)
            console.log("swtich found allocate")
            break;
        case "sub":
            sub(itemId,itemName,quantity,currentDate,mealType,)
            console.log("swtich found sub")
            break;
    }

}

function allocate(itemId,quantity,currentDate,mealType,button){
    axios.post(`/foodinventory/api/inventory/${itemId}`, { quantity: quantity, date: currentDate,mealType: mealType })
    .then(response => {            
        // Using showAlert instead of alert
        showAlert(response.data.message);
        console.log(response)
        button.disabled = true;
        button.setAttribute("disabled","disabled")
    })
    .catch(error => {
        console.error(error.response ? error.response.data.message : 'Error updating inventory.');
        
        // Use showAlert with 'danger' category for errors
        showAlert(error.response ? error.response.data.message : 'There was an error updating the inventory.', 'danger');
        button.disabled = false;
    });
}

function sub(itemId,itemName,quantity,currentDate,mealType){
    
    const queryParams = new URLSearchParams({
        itemId: itemId,
        itemName: itemName,
        quantity: quantity,
        currentDate: currentDate,
        mealType: mealType
      });
    
      window.location.href = `/menus/sub?${queryParams}`; // Redirect to new page with query parameters
  
}

/*
document.addEventListener('DOMContentLoaded', function () {
    const buttons = document.querySelectorAll('.btn-outline-secondary');

    buttons.forEach(button => {
        button.addEventListener('click', function () {
            updateInventory(this);
        });
    });
});
*/

function showAlert(message, category = 'success') {
    const alertPlaceholder = document.getElementById('flash-message');
    
    // Set the message and class for the alert
    alertPlaceholder.textContent = message;
    alertPlaceholder.classList.replace('alert-success', `alert-${category}`);
    
    // Show the alert element
    alertPlaceholder.style.display = 'block';

    // Use Bootstrap utility classes to animate fading out
    setTimeout(() => {
        alertPlaceholder.classList.add('fade');
        setTimeout(() => { 
            alertPlaceholder.style.display = 'none';
            alertPlaceholder.classList.remove('fade');
        }, 150); // Matches Bootstrap's fade transition duration
    }, 5000); // Time until we start fading out the message (5 seconds)
}
