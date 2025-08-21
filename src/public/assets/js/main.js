async function pm2AppAction(appName, action){
    try {
        let response = await fetch(`/api/apps/${appName}/${action}`, { method: 'POST'})    
        
        if(!response.ok){
            let content = await response.json()

            throw new Error(`Failed to ${action} app ${appName}, ${content.message}`);    
        }

        
    } catch (error) {
        alert(error.message).
        console.log(error)

    }
    
    location.reload();
}