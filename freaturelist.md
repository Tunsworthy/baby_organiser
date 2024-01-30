Making an alerts API endpoint

We are using nodejs, controllers are stored in /controllers. connection file is /config/postgresConnection.js
Please create the controller and route file I required (stored /routes)

1) database table
    Create postgress table for alerts
    ID - Name - Type - Message - createddate (auto generated) - status (active/inactive)

2) API endpoint
    endpoints should be
    GET - ALL
    GET - one by ID
    GET - all active
    Post - Create new alert
    Patch - by id

Displying alerts

Frontend using, nodejs, PUG and Bootstrap 5

1) Main dashboard page
    On large screens two secions should be shown 
    on the left - schedule
    on the right - alerts

    on mobile schedule should be top and alerts under

Please generate the required pug files for the following alets page.
This should be a seperate PUG file that will be included into the index.pug file, it will live in a subfolder called alerts
We are using Nodejs, PUG and Bootsrap 5

Alert Types:
    Inventory - alert-danger - exclamation-triangle-fill
    Information - alert-primary - info-fill

Alert Disply
    - Only display Active alerts
    - Display the latested alert first
    - Display only the message

Alert actions
    - allow alerts to be 'dismissed'
    - When an alert is dismissed it update the status of the alert from active to inactive

Alets API
    router.get('/alerts', alertController.getAllAlerts); // Get all alerts
    router.get('/alerts/active', alertController.getActiveAlerts); // Get all active alerts
    router.get('/alerts/:id', alertController.getAlertById); // Get an alert by ID
    router.post('/alerts/', alertController.createAlert); // Create a new alert
    router.patch('/alerts/:id', alertController.updateAlertById); // Update an alert by ID
    API Accesed via Process.env.SERVER eg http://${process.env.SERVER}/api/<alerts>


Meuns feature
    page load takes you to cureent day
    when you click on the item it 'allocates' it - changing the colour and deducting the qty from the inventory - Done
    update menus API to provide menu by date (for dashboard and) - Done

Food Inventory 
    Sortable List
    Default Available at the top

Alerts Generator
    Stock running low