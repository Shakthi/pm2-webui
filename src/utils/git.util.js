const { exec } = require('child_process');

const getCurrentGitBranch = async (cwd)=>{
    return new Promise((resolve, reject) => {
        exec('git rev-parse --abbrev-ref HEAD', { cwd }, (err, stdout, stderr) => {
            if (!err && typeof stdout === 'string') {
                resolve(stdout.trim())
            }
            resolve(null)
        });
    })
}

const getCurrentGitCommit = async (cwd)=>{
    return new Promise((resolve, reject) => {
        exec('git rev-parse --short HEAD', { cwd }, (err, stdout, stderr) => {
            if (!err && typeof stdout === 'string') {
                resolve(stdout.trim())
            }
            resolve(null)
        });
    })
}

const getPullCurrentGitBranch = async (cwd)=>{
    return new Promise((resolve, reject) => {
        exec('git pull', { cwd }, (err, stdout, stderr) => {
            if (!err && typeof stdout === 'string') {
                console.log(stdout)
                resolve(stdout.trim())
            } else {
                reject(err || stderr)
            }
        });
    })
    
}


module.exports = {
    getCurrentGitBranch,
    getCurrentGitCommit,
    getPullCurrentGitBranch
}