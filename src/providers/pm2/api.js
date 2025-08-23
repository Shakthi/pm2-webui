const pm2 = require('pm2');
const { bytesToSize, timeSince } = require('./ux.helper')

const { getPullCurrentGitBranch } = require('../../utils/git.util')
const { doNPMInstall, doNPMRunScript } = require('../../utils/package-json.util')

function listApps(){
    return new Promise((resolve, reject) => {
        pm2.connect((err) => {
            if (err) {
                reject(err)
            }
            pm2.list((err, apps) => {
                pm2.disconnect()
                if (err) {
                    reject(err)
                }
                apps = apps.sort((a, b) => {
                    {
                        return b.pm2_env.pm_uptime - a.pm2_env.pm_uptime; // sort by uptime if both are online or offline
                    }
                }).map((app) => {
                    return {
                        name: app.name,
                        status: app.pm2_env.status,
                        cpu: app.monit.cpu,
                        memory: bytesToSize(app.monit.memory),
                        uptime: timeSince(app.pm2_env.pm_uptime),
                        pm_id: app.pm_id
                    }
                })
                resolve(apps)
            })
        })
    })
}

//remove /usr/local/bin or /usr/bin from the path
function removeBinPath(path) {
    return path.replace(/(\/usr\/local\/bin|\/usr\/bin)\/|\/bin\//g, '');
}

function appendInterpreter(interpreterPath) {
    if (interpreterPath === "none") {
        return "";
    }
    return `(${removeBinPath(interpreterPath)}) `;
}




function describeApp(appName){
    return new Promise((resolve, reject) => {
        pm2.connect((err) => {
            if (err) {
                reject(err)
            }
            pm2.describe(appName, (err, apps) => {
                pm2.disconnect()
                if (err) {
                    reject(err)
                }
                if(Array.isArray(apps) && apps.length > 0){
                    const app = {
                        name: apps[0].name,
                        start_cmd: appendInterpreter(apps[0].pm2_env.exec_interpreter) + ' ' + removeBinPath(apps[0].pm2_env.pm_exec_path) + ' ' +  ((apps[0].pm2_env.args)?apps[0].pm2_env.args.join(' '):''),
                        status: apps[0].pm2_env.status,
                        cpu: apps[0].monit.cpu,
                        memory: bytesToSize(apps[0].monit.memory),
                        uptime: timeSince(apps[0].pm2_env.pm_uptime),
                        pm_id: apps[0].pm_id, 
                        pm_out_log_path: apps[0].pm2_env.pm_out_log_path,
                        pm_err_log_path: apps[0].pm2_env.pm_err_log_path,
                        pm2_env_cwd: apps[0].pm2_env.pm_cwd
                    }
                    resolve(app)
                }
                else{
                    resolve(null)
                }
            })
        })
    })
}

function reloadApp(process){
    return new Promise((resolve, reject) => {
        pm2.connect((err) => {
            if (err) {
                reject(err)
            }
            pm2.reload(process, (err, proc) => {
                pm2.disconnect()
                if (err) {
                    reject(err)
                }
                resolve(proc)
            })
        })
    })
}

function gitPull(process) {
    return new Promise((resolve, reject) => {
        pm2.connect((err) => {
            if (err) return reject(err);

            pm2.describe(process, async (err, apps) => {
                if (err) {
                    pm2.disconnect();
                    return reject(err);
                }

                if (apps.length > 0) {
                    const cwd = apps[0].pm2_env.pm_cwd;

                    try {
                        await getPullCurrentGitBranch(cwd);
                        pm2.disconnect();
                        resolve(`Pulled latest changes in ${cwd}`);
                    } catch (gitErr) {
                        pm2.disconnect();
                        reject(gitErr);
                    }

                } else {
                    pm2.disconnect();
                    reject(new Error('App not found'));
                }
            });
        });
    });
}

function npmPackageActions(process,data) {
    return new Promise((resolve, reject) => {
        pm2.connect((err) => {
            if (err) return reject(err);

            pm2.describe(process, async (err, apps) => {
                if (err) {
                    pm2.disconnect();
                    return reject(err);
                }

                if (apps.length > 0) {
                    const cwd = apps[0].pm2_env.pm_cwd;

                    try {
                        console.log(data)
                        if(!data){
                            await doNPMInstall(cwd);
                            pm2.disconnect();
                            resolve(`Installed dependencies in ${cwd}`);                            
                        }
                        else if (data.action === 'run-script') {
                            await  doNPMRunScript(cwd,data);
                            pm2.disconnect();
                        }
                     
                    } catch (err) {
                        pm2.disconnect();
                        reject(err);
                    }

                } else {
                    pm2.disconnect();
                    reject(new Error('App not found'));
                }
            });
        });
    });
}




function stopApp(process){
    return new Promise((resolve, reject) => {
        pm2.connect((err) => {
            if (err) {
                reject(err)
            }
            pm2.stop(process, (err, proc) => {
                pm2.disconnect()
                if (err) {
                    reject(err)
                }
                resolve(proc)
            })
        })
    })
}

function restartApp(process){
    return new Promise((resolve, reject) => {
        pm2.connect((err) => {
            if (err) {
                reject(err)
            }
            pm2.restart(process, (err, proc) => {
                pm2.disconnect()
                if (err) {
                    reject(err)
                }
                resolve(proc)
            })
        })
    })
}

module.exports = {
    listApps,
    describeApp,
    reloadApp,
    stopApp,
    restartApp,
    gitPull,
    npmPackageActions
}

