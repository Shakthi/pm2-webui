async function pm2AppAction(appName, action,data){
    try {

        
        let elements = document.getElementsByClassName('icon-trigger-' + action);
        if(elements && elements.length > 0){
            Array.from(elements).forEach(element => {
                element.classList.add('spin');                
            });    
        }
        

        let dataQueryParam = '';
        if(data){
            dataQueryParam = `?data=${data}`
        }

        let response = await fetch(`/api/apps/${appName}/${action}${dataQueryParam}`, { method: 'POST'})    
        
        if(!response.ok){
            let content = await response.json()

            throw new Error(`Failed to ${action} app ${appName}, ${content.message}`);    
        }

        
    } catch (error) {
        if (error.constructor.name == 'TypeError' && error.message == "Failed to fetch") {
            return;
        }

        alert(error && error.message);

    }
    
    location.reload();
}