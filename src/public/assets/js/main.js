async function pm2AppAction(appName, action){
    try {

        
        let elements = document.getElementsByClassName('icon-trigger-' + action);
        if(elements && elements.length > 0){
            Array.from(elements).forEach(element => {
                element.classList.add('spin');                
            });    
        }
        



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