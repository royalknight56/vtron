/* eslint-env node */
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
  const version = packagejson.version.split('.');
  version[2] = parseInt(version[2]) + 1;

  if (parseInt(version[2]) >= 10) {
    version[2] = 0;
    version[1] = parseInt(version[1]) + 1;
  }
  const nextVersion = version.join('.');
  packagejson.version = nextVersion;
  fs.writeFileSync('./package.json', JSON.stringify(packagejson, null, 2));

  await waitExec('npm run bl');
  console.log('build success');
  await waitExec('git add .');
  console.log('git add success');
  await waitExec(`git commit -m "[plus]publish: ${nextVersion}"`);
  console.log('git commit success');
  await waitExec(`git tag plus-${nextVersion}`);
  console.log('git tag success');
  await waitExec('git push');
  console.log('git push success');
  await waitExec('git push --tags');
  console.log('git push --tags success');
  await waitExec('npm publish');
  console.log('npm publish success');
}
updateVersion();
