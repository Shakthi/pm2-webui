const fs = require('fs');
const path = require('path')


const getPackageJson = async (wd)=>{
    const envPath = path.join(wd, 'package.json')
    return new Promise((resolve, reject) => {
        fs.readFile(envPath , 'utf-8', function(err, data){
            if(!err){
                resolve(data)
            }
            resolve(null)
        })
    })
}

const isFileExists = async (wd)=>{
    const envPath = path.join(wd, 'package.json')
    return new Promise((resolve, reject) => {
        fs.access(envPath, fs.constants.F_OK, (err) => {
            if(!err){
                resolve(true)
            }
            resolve(false)
        })
    })
}

const getPackageJsonScripts = async (wd) => {
    if(!await isFileExists(wd)){
        return null
    }   
    const scriptsData = await getPackageJson(wd)   
    return JSON.parse(scriptsData).scripts    
}
    

module.exports = {
    getPackageJsonScripts,
    
}