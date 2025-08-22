const fs = require('fs');
const path = require('path')
const { exec } = require('child_process');


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
async function fileExists(path) {
  try {
    await fs.promises.access(path);
    return true; // file exists
  } catch {
    return false; // file does not exist
  }
}


const doNPMRunScript = async (wd,data) => {
    let scriptCmd = data.cmd;
    await createLockFile(wd, 'npm-run-script'+scriptCmd)
    const packageLock = path.join(wd, 'package-lock.json');
    const yarnLock = path.join(wd, 'yarn.lock');

    let cmd = ""

   

    let packageLockExists = await fileExists(packageLock)
    let yarnLockExists = await fileExists(yarnLock)
    if(packageLockExists && yarnLockExists){
         deleteLockFile(wd)
        throw new Error("Cannot have both yarn.lock and package-lock.json")
    }

    if(packageLockExists){
        cmd = "npm run " + scriptCmd
    }else if(yarnLockExists){
        cmd = "yarn " + scriptCmd
    }


    return new Promise((resolve, reject) => {
        exec(cmd, { wd }, (err, stdout, stderr) => {
            

            if (!err && typeof stdout === 'string') {
                deleteLockFile(wd)
                resolve(stdout.trim())
            }else if (err && typeof stderr === 'string') {
                deleteLockFile(wd)
                reject({out:stdout.trim(), err: stderr.trim()})
            }else{
             deleteLockFile(wd)
             resolve(null)
            }
        });
    })
}

const doNPMInstall = async (wd) => {
    await createLockFile(wd, 'npm-install')
    const packageLock = path.join(wd, 'package-lock.json');
    const yarnLock = path.join(wd, 'yarn.lock');

    let cmd = ""

    console.log('Package Lock : ', packageLock)
    console.log('Yarn Lock : ', yarnLock)

    let packageLockExists = await fileExists(packageLock)
    let yarnLockExists = await fileExists(yarnLock)
    if(packageLockExists && yarnLockExists){
         deleteLockFile(wd)
        throw new Error("Cannot have both yarn.lock and package-lock.json")
    }

    if(packageLockExists){
        cmd = "npm install"
    }else if(yarnLockExists){
        cmd = "yarn install"
    }


    return new Promise((resolve, reject) => {
        exec(cmd, { wd }, (err, stdout, stderr) => {
            
            console.log(stdout )
            console.log(stderr )

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
    doNPMInstall,
    doNPMRunScript
    
}