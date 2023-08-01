const { exec } = require('child_process');
const fs = require('fs');
function waitExec(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}
async function updateVersion() {
  const packagejson = JSON.parse(fs.readFileSync('./package.json').toString());
  console.log(packagejson);
  const version = packagejson.version.split('.');
  version[2] = parseInt(version[2]) + 1;

  if (parseInt(version[2]) >= 10) {
    version[2] = 0;
    version[1] = parseInt(version[1]) + 1;
  }
  let nextVersion = version.join('.');
  packagejson.version = nextVersion;
  fs.writeFileSync('./package.json', JSON.stringify(packagejson, null, 2));

  await waitExec('npm run build-lib-tsc');
  await waitExec('git add .');
  await waitExec(`git commit -m "publish: ${nextVersion}"`);
  await waitExec(`git tag ${nextVersion}`);
  await waitExec('git push');
  await waitExec('git push --tags');
  await waitExec('npm publish');
}
updateVersion();
