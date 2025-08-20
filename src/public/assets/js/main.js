async function pm2AppAction(appName, action){
    try {
        await fetch(`/api/apps/${appName}/${action}`, { method: 'POST'})    
    } catch (error) {
        alert(`Failed to ${action} app ${appName}. Please check the console for more details.`);
        console.log(error)

    }
    
    location.reload();
}