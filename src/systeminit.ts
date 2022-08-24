/*
 * @Author: RoyalKnight
 * @LastEditTime: 2022-07-14 18:45:04
 * @Description: 
 */
import { System } from "./plug";
import backimg from "./assets/back.jpg"
let system = new System({
  if_logo_show: true,
  start_time: 0,
  backimg: backimg,
  // login: {
  //   user_name: 'AdDD',
  //   user_password:'123'
  // },
  // start_menu_logo: brow,
});
let system2 = new System({
  if_logo_show: true,
  start_time: 1100,
  backimg: backimg,
  // login: {
  //   user_name: 'AdDD',
  //   user_password:'123'
  // },
  // start_menu_logo: brow,
})
export {
  system,
  system2
}