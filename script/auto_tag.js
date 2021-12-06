/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-12-06 14:46:04
 * @Description: 
 */
let date = new Date();

let dateStr = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getHours() + date.getMinutes();

console.log(dateStr);

//运行shell命令
const exec = require('child_process').exec;
let command = `git add . && git commit -m "auto_tag" && git tag ${dateStr} && git push origin master`
// let command = `git`

exec(command
    , (err, stdout, stderr) => {
        if (err) {
            console.error(`exec error: ${err}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });


// var fs = require('fs'),
//     path = require('path');

// function getPackageJson() {
//     console.log('----------------------1.开始读取package.json')
//     var _packageJson = fs.readFileSync('./package.json')
//     console.log('----------------------读取package.json文件完毕')
//     return JSON.parse(_packageJson)
// }
// console.log(getPackageJson())

