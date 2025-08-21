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

const createLockFile = async (wd, operation) => {
    const envPath = path.join(wd, '.pm2webui.scripts.lock')
    let oldContent, oldContentJson;
    
    let returnFast = false;

    try {
        oldContent = await fs.promises.readFile(envPath, 'utf-8')
        oldContentJson = JSON.parse(oldContent)
        if (oldContentJson.lastUpdate > new Date().getTime() - 60000) {
            returnFast = true;
        }else{
            await deleteLockFile(wd)
        }

    } catch (error) {

    }   

    if(returnFast){
        throw new Error(oldContentJson.operation + ' is already in progress from ' + Date(oldContentJson.lastUpdate))
    }


    let content = {
        operation: operation,
        lastUpdate: new Date().getTime()
    }
    content = JSON.stringify(content);
    

    await fs.promises.writeFile(envPath, content)
    
}

const deleteLockFile = async (wd) => {
    const envPath = path.join(wd, '.pm2webui.scripts.lock')
    await fs.promises.unlink(envPath)
}

const getLockedOperation = async (wd) => {
    const envPath = path.join(wd, '.pm2webui.scripts.lock')
    let oldContent, oldContentJson;
    try {
        oldContent = await fs.promises.readFile(envPath, 'utf-8')
        oldContentJson = JSON.parse(oldContent)
        if (oldContentJson.lastUpdate < new Date().getTime() - 60000) {
            return null
        }
        return oldContentJson.operation
    } catch (error) {
        return null
    }
}

const doNPMInstall = async (wd) => {
    await createLockFile(wd, 'npm-install')
    const packageLock = path.join(wd, 'package-lock.json');
    const yarnLock = path.join(wd, 'yarn.lock');

    let cmd = ""

    let packageLockExists = await fs.promises.access(packageLock, fs.constants.F_OK);
    let yarnLockExists = await fs.promises.access(yarnLock, fs.constants.F_OK);
    if(packageLockExists && yarnLockExists){
        throw new Error("Cannot have both yarn.lock and package-lock.json")
    }

    if(packageLockExists){
        cmd = "npm install"
    }else if(yarnLockExists){
        cmd = "yarn install"
    }


    return new Promise((resolve, reject) => {
        exec(cmd, { cwd }, (err, stdout, stderr) => {
            if (!err && typeof stdout === 'string') {
                deleteLockFile(wd)
                resolve(stdout.trim())
            }
            deleteLockFile(wd)
            resolve(null)
        });
    })
}

const doExecuteScript = async (wd, script) => {
    let cmd = "npm run " + script
    await createLockFile(wd, cmd)
    return new Promise((resolve, reject) => {
        exec(cmd, { cwd }, (err, stdout, stderr) => {
            if (!err && typeof stdout === 'string') {
                deleteLockFile(wd)
                resolve(stdout.trim())
            }
            deleteLockFile(wd)
            resolve(null)
        });
    })
}

module.exports = {
    getPackageJsonScripts,
    getLockedOperation,
    doNPMInstall
    
}