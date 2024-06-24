import GitHub from './assets/GitHub.png';
import baidumapicon from './assets/baidumap.png';
import flowicon from './assets/flowicon.png';
import friendLinkicon from './assets/friendLink.png';
import markdownicon from './assets/markdown.png';
import vscode from './assets/vscode.png';
import winv3icon from './assets/winv3.png';

import beaticon from './assets/beat.ico';
import kiometicon from './assets/kiomet.webp';
import signalicon from './assets/signal.png';
// import galleryicon from './assets/gallery.png';

import GitStars from './components/apps/GitStars.vue';
import GotoReadMe from './components/apps/GotoReadMe.vue';

import CreateUrl from './components/apps/CreateUrl.vue';
import FriendLink from './components/apps/FriendLink.vue';
import NoteMd from './components/apps/NoteMd.vue';
// import Gallery from './components/apps/Gallery.vue';
const magnetConfig = [
  {
    title: 'kiomet',
    icon: kiometicon,
    width: 800,
    height: 600,
    center: true,
    content: 'https://kiomet.com/',
    backgroundColor: '#2b3948',
    resizable: true,
  },
  {
    title: '百度地图',
    icon: baidumapicon,
    width: 800,
    height: 600,
    center: true,
    content: 'https://map.baidu.com/',
    resizable: true,
  },
  {
    title: '创建网络链接',
    icon: signalicon,
    width: 400,
    height: 400,
    center: true,
    content: CreateUrl,
    resizable: false,
  },
  {
    title: '点个star',
    icon: GitHub,
    width: 170,
    height: 100,
    center: true,
    content: GitStars,
  },
  {
    title: '意见反馈',
    icon: beaticon,
    width: 800,
    height: 600,
    center: true,
    content: 'https://w0akxkb81ek.feishu.cn/share/base/form/shrcnxXNS3dN7XpIfPdXNknjxNf',
  },
];
const desktopConfig = [
  {
    title: 'github1s',
    icon: vscode,
    width: 800,
    height: 700,
    center: true,
    content: 'https://github1s.com/',
    resizable: true,
  },

  // {
  //   title: "MarkDown",
  //   icon: markdownicon,
  //   width: 800,
  //   height: 600,
  //   center: true,
  //   content: MarkDown,
  //   resizable: true,
  // },
  // {
  //     title: '音乐',
  //     icon: moonappicon,
  //     width: 800,
  //     height: 600,
  //     center: true,
  //     content: MusicVue,
  //     resizable: true
  // },
  {
    title: 'PhotoShop',
    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABACAYAAACunKHjAAAAAXNSR0IArs4c6QAABYBJREFUeF7tm31MG2Ucx79Hx9soQ6C8SlthCmHEqSjgUKLGsIguzs3BZmKyaYbRzRjjdGYbRozRqPElwS1qpjNLXLI5HcQsM5MYTRgbL9scKONtgLTNtgq0lEJ563rmKbTpcdf2Dm7dtblL+s/d73nu9/3093ve7nkoyJeTACVzmCMgg5iPBBmEIBCawmrQyACFDMD5UwNYIcG0mgIFHWhKB8AAOK7BEXYUhuZ2f776jgj1/StBKWoAPOmvIgk/nwJN74e+9S1fPnoHQaIAeFfCAoW6ZoSuJdVbIW4QGQ8WIczRJPRN0renDkLX/BKXn9wgNAXtAHW39IUtwkMKGzHYUruwJBtE6KXEQs19iDDl4cqVac8HHCAKvgEozvBZBH+JFqFXQtfa7wdE4UkAT0lUgUhuUSXQNZ/xFxGh2z64lNP0Fuhbj/mLiFEAcSKhl2Y1NHZB3/K5PxC0NL0X1av3oGsh4yT3xdVryCCceDSFMggZhGeyCIwIZVY+0tZW+kzgWesI7FYTpk1XYdNfxuT1XjimJ0VNeoGVid9GEBB3vfyVID9mLUMYOnscxj8OCyonorE0QLgETRn70ffd65gZNYqokVdV0gLhcrltXwkcszO8FIhkJE0Qw+d+hr72E5E08qomcCD+2l3k9mhZTBzCY1WIVGmgKd8HRXQsy9vBY9UwXfiVlwoRjG4NCE/Hl6tzod1cjajkOxh6TOdPYvDH9zk1KjPvQWLB04hISGc9n7H8B/PF0xjrPiuEz60HQbxNL9uBlMe2Mhwn3Wr3ly+wxGSs34Wkhyr8irxW/y2u1x/0azdvIA0QcatKkLXtU4bTjplJtFU96r4XHpsITUUVVuQU8xIXlCAS8sug3cKY88BuG8Pf1aVu0dk7DyFGm8cLAjEKShDqZ/dAVfQMQyQZU3R+9pzzXkR8GvL21LEgELHkUkRGY5kyAeHKBMRmzzXKQQcisXA9NJv2skSOdTai7/s3nPcTHlgHbcU7DJvx/ovo/foVzgi5bfXjzvuj7b/zjaDAtxGUIhzhK1QgOR+fX4ak4k2czv57pArmtnrnM9WajVBveJsFQvfTB5geNvAV68sucCCEeGszdKK7Zpu7SIx2NbJ3cvcA5kunYSLdZVejkFcstJUeCPvEqDMlbLoOt7NhkdHIefUQolKyvIq1dDZgpKkOlk7GGixfONICQSZb+hMfYayLPRiKSslE5vMf+oRBVBMgV08dwJRxgC8EYicNEBO6f2C+9BtMF07hxqTVqwAC4/Z1r/kdS5AeZ+CHvUJgBA6Eq6vzVGmfMMPa0yS4wYu/by2SistB2g5vF4HRvf9Fvgs+gQPhOekSErO+bEm3mvzwZkSnZ3Oa9RyoxMSg360QgU2NmwHCpT4u7xFkbWVP2/W1H2P43Ak+3IMjIlJLt8MxPYGhxuOgb9g5hZHlQbJM6HkZfvkCQ2eOhhaItNK5BeGR5jpMGgdgHzeDtDFkaB0Rn4L0J3awBPcffhOWjobQBMFHFbGxGbrQXcOc2vsoGzyp4YoIviBI9ynpuQZfIZ52qaWVSCvdzruowJnnzek1yKBHvWE3y2lvM0W+6pSZ90J5ZwHictYgMlkLRZSSUZRMvqx95zF2uWExw2zxU4OvsKXaORd/kzSYtQ5j1jIMx4xtKVUGL4ilqOYoK4OYhyKDkEEw80OOCCERIW8mc9IK5e3HrvTgub1Q3nA6HxHyFuQ5ECF3TmPheIrnpvRQbyd4H1MgIOSDKx5RpCkkx5iYn6xFHvAHuLpFHGVyeSgfblvwX801oLkAlQvQq8iX+QD/m8JeR6EHDnSAQi8c1JGlH3fkfH25AuqBXNBQCfMuANZU2Dimlndh6M9xoW+TTwLPE5NByCCYyfM/A4yCX/Y+s20AAAAASUVORK5CYII=',
    width: 800,
    height: 600,
    center: true,
    content: 'https://ps.fktool.com/',
    resizable: true,
    backgroundColor: '#474747',
  },
  {
    title: '友链',
    icon: friendLinkicon,
    width: 600,
    height: 400,
    center: true,
    content: FriendLink,
    resizable: true,
  },
  {
    title: '混元大模型',
    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASYAAAE1CAYAAABKhk3vAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAhdEVYdENyZWF0aW9uIFRpbWUAMjAyMzowMzowNCAyMToyMjowN1IJUEIAACofSURBVHhe7d0HeBvl/QdwnbYsy7YsyduW7XiPbEICtIRZdhhlFAiblDJDgX8byl4tbRkBCmGk7FUoZZcRCCsJJJC9E29b25KHtizd/y55adPg2NLpztZZ38/z8PD+XittQs5fv+97770nAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYOxT5NwBwRNM0Ze8PVuyyBhq7nL4qe1/Y7PFG8kMRWh2ORlW5OqUzV6uwm/MzNjUVZv9gLlRtpygqRn45DAPBBJCAgQHauNPRN7nV5m9scwaaW63+ye1Of60/HNMx30wy8rERmbIVnUc1md48ZWbBkyV56p2kG/aBYAIYRiwW027rGWxqsfobWh2Bye12f2MLE0b9voiR+bJ8z4co9vuH4vw9xPzK8DFTjK9fcULxIqNW20O6gYFggrTGTMMUu23emk5noIEJnmkttkBzm8PXbPeECmkJpSQfE5RWJe+9fl75NcdOyXuVdKU9BBOkDbvXW9BlizS0OPwNu7p9MzscgXpmOlYfjkS1zPBFSj42TujI6bOLnlh4csV1pCOtIZhgwrENxvK77f2NLXZ/U4c90MyMhJrZAAqGh3TJTL2ERksk0bMPK3zo6uMrbiJdaQvBBKLFTMMyt3YPNLLrQG2O4JRWm6+xzRFo9vgiRubCjmshOuXQdHjhvIrrTj+4aAnpSUsIJkh5TADJO/uD5m6Lv26H1TurzR5o6nD6GzsdQXNMIlGTj00Ychk18PcrGueUF2VtJV1pB8EEKYPdD8QEUGWHJVDf7vA1MiOgycwIqKnLGayMxGgNxXyduWKZazZ1p2N8mVqetfyRy5uOJGXaQTDBuHF4vYXf7/AetbnL97MWq3dauz1QE4hEs9IheEbDrjc9eFH9MQdV65eTrrSCYIIxxY6KVux0H//Pb2zXrm3rn8vUSgTR8GbV5Lz71wsb5pEyreCCgDGzpav/4Ifea390Z493JsJodDIpNfj2jQdXZGdLe0lX2hjnvRuQDphRkXTpss7brlqyZdnOHt9BCKX4RGMx9dc7nCeQMq0gmEBQAwMx043Pbvvg+c+7bo9JJJmkG+JCKTZ3D/6cFGkFwQSCsXoCFRcv+WH1mpa+45hBEq41Drb3eJkRZvrBxQKCcPl8xdct3fqpsz9STrqAA3tfqJQ00wqCaYLqcvlKNrT1z/52l+eIbZ2DzaR7TFgHY3nXLNn+mc0TmkS6gCNfYCgzFotpSJk2sAgpch4PndPpHmxucXkbW6yBqXs3JvrrvcFYNkXRMnahmaYlQ5kauev46aaXfjXLfJfJJB0kv1wQC5duXra2deAoUkIyaDr8zk2H5Ov1VB/pSQsIJpFgfmqqdlv8DbttgYZWp7e5jT2ew+5vdg2E8pm/RcXeT418t4sNKKNO2XXvBXW/bCjOXEu6efX3zzpvee7zrrtG+71AnBBMkApompa1uUJVnVZvw267byr7SEaL3T/Z6g4UMsGSwcc3vFYttz1+xeQjKkzq7aSLF+vaBw69/pkty2I0PeGeXxs/dOSLu+dkS6XSAOlICwimceRy+Yp3uyONLTZvU6s90Nxu9zUxQVQTidJaSkJLhRx1VORrNj93zdSpFEVFSVfS5i9eu7nDEWwkJfAgUyNzfXjLwSZSpg0E0xhxxWJZ6za6jt/QMXhEq21PANX6AkNZe6dhYz/tYZ/F+sMvqy88bprpZdKVlHdXWy/+6zutS8fjzzKRledlbHjhuqlTSZk2cBEJjF0beubTzltfW2G9Zu9IKHXOCSozaLa+9NtpSY9w2D/jmX9Zu9s5EC4hXcALmj6s3vDP+86vO5N0pA1sFxCQ1RMov2DxhvUvfdVz81CUzkqlUGJ19vqrt3R7p5GSszdW2q5EKAliqNSYnm9RQTAJpM0ZrLvyyc1fdLoCdak6vaEllPSHXZ7jSMnZ+9/bfk2awCdaQpuN2rQ8LA7BJAB2PWnRi1vf6x2MmElXSmJHcGtbBg4nJSebO/tmdTgC1aQEHtEURVeYFLzeORULBJMAHnhlx3OW3mAVKVOapS+53+fHa10XMQmHtUoBUBI6ZirN2kXKtIJg4tmy9Y5zvtnmOYWUKa9vMFxAmpx8ucV9Bu7ECUOvVfYapdIBUqYVBBOP2Geanvio40+ptsg9kuAQraVpOoOUCdllHWzs80fSbo/NWCnPz0jL0RILwcSj176xXuMYjIju7hQTTDRpJmRrh3c2RkvCKTOo0nJ9iYVg4tG/VtsWiGm0xFLIKD/Xxx1anYHppAkCKDNpt5Bm2kEw8eSLTa7TbZ6Q6M4eyspQcD5PusMZqCdNEECpQb2NNNMOgoknn2/uPXvv823ikp0hc5BmwizuIM5bEgxNFxuVabm5koVg4gFN04rVuzzHim+9haYL9erdpEgIewqCvS+U1B09ODC1XOovMWRYSJl2EEw8+H5336H+UDSblKJB01S02KBqJWVCuhzBCjpGy0kJPCs1ZeykKCpGyrSDYOLBLot/jijvTlESqtSg3kGqhHS5/ZOYPzKuH4GUGTVpe0eOhQuLB7vt3hmkKTrFRnULaSak2x2uYsdcpAQesUfSlJnSd+GbhWDiQZvdL87D0WgJnZ+taidVQnpc/hrSBL4xfy+lJs0mUqUlBBMPLG5xLgLLZFSU6wJrd28ID+4KhWJGTEZV2t6RYyGYktTfHzMEQlFOj3SMt8IcZTvXBdYed7AWu76FIZNIItWFOk43JSYKBFOSOvsHKpl/ifLuVJFBw2l9id0q4OgLlZESeJaXo3IwPzCCpExLCKYk2dzhSrHenSo1qDjtYeq0B81RGlsFhGLO03C6UzqRIJiSZPGEKsR6d6qI4+bKbo8f60sCMqfxoyg/QjAlyeYOsVM5USoxqjkdq2HZs74EgqDpWKlJvZFUaQvBlCRLX1C0wVRg0LaRZkJ6ekN1pAk8Y4/TNZu0ab25koVgStLeI3TFd3dKyvyOyw1KTnuYut0BURwbLEYUTUcrDDpOU+yJBMGUBPbulHMgUkxKUTFmKy1SqTREyoR0u8VxnrkYZWoU3uxsKeejaCYKBFMSbH3B0ihNi3IvT7Ge27NYTBhL7X3hIlICz8x5WPhmIZiS0OEKVjBDb1EGU5FBxWkPExPGZUNRbBUQitmIrQIsBFMSbJ5gBbtYSUpRKcnldkeu3RmqFuOBeOJAR5hgwoiJgQssCVZPuEas36RFuUpO3wDdLj9OrRQKLaGL8zWbSZXWEExJ2Hu0rDifFys2qDk9i2XpDdaw30CkBB7t2SqgT99XNu0LwZQEqzsg2j1MXB8S7RbJG4bFSCGVhMry1B2kTGsIpiRY3GEzaYpKTqail+tDohZPsBonVwqjxKi2Mn8vQ6RMa7jAOHLGYjpvMJJFSlEp0Ss53fmhaZqyucX3iiqxKDVm4I4cgWDiyG1hF4EpBSlFJTwk0ZBmQiyeQGk4RovyzywGZqN6K2mmPQQTR1Z3sII0RUelkg2QZkK6HaFqse7bEgOzMWMDaaY9BBNHFrd4H94t0nPbXNnTH8BxJ4Kh6eL8jLR/ePdHCCaOLP0hUd2d2vf+fkWemtNemW5XsBYL38KgJVTMVKxN+4d3f4SLjCOrR1yLwPvOv2qKtWtIMyE9veIKYzExZSkc+RTlJWXaQzBxZHUHRTutKc1XcvrJ3IM9TIIpM2LH974QTBywt83t/eI8jJ/dp56n1TpJmRCLJ4gXEAhg7wsusVVgXwgmDtjb5pEhcd42V8ioCEVRUVLGrcvlK4lEaRUpgU/sCy6N6i2kAgaCiQNb35BoNxmqlbJB0kyIzROuwqkCwqAomi4zYA/TvnChcWDvDYh2D1OmSuYhzYT09Ip3e0SqY+/IlRcr0/rNu/tDMHFg7Q+J9i0hWRoFp/Wlrt5gHTvlICXwSK2Q+vMzM22kBAaCiQNLr3g3GuZmy7tJMyE97BEv1P/sOgCemE1qTm+rmcgQTBxY+kIiPSyNpvVaJbc7cu5AjVjPnkp1ZTi18icQTBxYeoOifDMKOxXLVMv7SRU3dnuExc2+cRj4R9NMMOFRlP0gmBIUi8U0ff6InpSio5BSYdKMW2+vvyg0RKtJCTxjgmkTaQKBYEpQi91XyQwgxHn0B7tGxGGdqNUdqsKpAgJhRrEVRhU2V+4HwZQghycs6oPSKEoSI8249XjCOFVAIJSUGiov4nbM8USGYEpQd594z2HiysJuFcCpAoIo1Ku7KSrx6fVEh4stQbbe9Bs99LgDeGWTQMrxKMqwEEwJ6vWGC0gzbfS4caqAEGhaMlRqwh254SCYEjTgjxhIU3xoCR2J0kpSxYXdKtDTGxLl22BS3Z5n5EwZGDENA8GUIF8gmkua4kNR0kF/Yr9/l8tfGB6KYquAEJgfFCW5KmyuHAaCKUFSmUTU7/3yBoZySDMuHQOhScygCVsFBMC+ebc8NxsP7w4DwZQgjUou6uNPBwKJTUWt7gh2fAskK0Per9dTfaSEfSCYEqTTyHtJU5QGA1EjacbF6glWsWshpAQemY3qXaQJ+0EwJagiT9wHeg0EhhIaMTkHwuJ8LlAEzCYNpnEHgGBKUFVBxjrSFCWPN5xP0/GfROkNRrNJE3hWatLgjtwBIJgSNLnY+KVMKomQUnQi0Ziixx2IexQ0NBRVYvFbGGa8GeWAEEwJysmhPNMqsr8hpQhRVLcnFPfu9UyNfABrTMIo0WdgjekAEEwcnDiz4AnSFKVuZyDuo4H1WoWdNIFHcqkkXJav7iQl7AfBxMFRkw1v1BRqRbvW1JVIMOmUNkzl+FdiythNUZSo98QJCcHE0cJTzFco5VTCp0Gmgi5XMO5gKshW4EgOAZSbsL40EgQTR01lOasXnTHpcplMIrpw2tbtPYSmaRkpR9RYafqKkkoSfkEmHBj75t26Eu1qUsIwEExJOGpy3huPXDblmOrCjLXs4657Omk6xj41vqedonyhId3Obl8TKUdUlCV1Mj/dMWriEy2ha0t0K0kFw0AwJam5TLtm6dVTZzy/cEbDDadUXHzWoUUPzqrO/ig/W9VKUXSEDSry0RRCUeva+48gxaimV+Z8mpp/DnHSqmUD08uz1pAShoFFTQEx0yVFm2ugstMaaWh1+qa2OYIN1t6gud0RqA9FY5r/nKM9DqdDzqnTv33//PrTSDmibkew5rzFP6yjJVQG6YIkzG0y/OOuX9WeTUoYBoJpHLA7r9tdoZrPNzjO2tDeN6erN1zT740URqI0xYyyVGxSkY8KRquSez689aC8eO8M3fTc1ne/2+U5aSx+bxPdnedWn3ZEo+ltUsIwcJGlkP7+mOHjTdZzv97hnre90zcrNBTNFCwImKnZny9qPH52Tc4npGdEP7QO/Pz6pZuWMb8fcb4hJkUYdYqef/5uZhnzAwFT4xEgmFIUe9dsfcfg7E/X2c//dIPr3FCEziJf4s1Rkw0v33527fmkHNWtr25/5cvN7l+REhJG05cfU3bL/Lml95EOOAAEkwjEYjHtm99aL3lzhW2h1RNiftpK5ORLSVEppN5Pbj84n/np7SddI+rro/WXLvl+nXMwgqN2OdBr5Za3Fx1UHe9/73SGu3IiIJVKfWcdUvzo6zdOr1p0RtX87Ay5g3wpKaFILPODtY4zSDkq9jnBu86vPy1DJXOTLkjAhUeU3INQig+CSUSYi5o+YUbea88umll92sH5i2UUlfRpmv/+wb6ANOPSWJK57v75dSfqNPyEY7poKtN9fdrswiWkhFFgKidiGzt8M+96beubjgHuUyt2F/LDF9f/YkaV/jPSFZcOe2DS3W/ueG2HxT+NuYji2kWerpgps2fpb6bMKsvX7CZdMAqMmERssln7/dMLZk6dWZX9Htfd5myoPL2s6w5Sxs2cr2l5+sops68+wXxDrlZuYe/ysSHHLvCSjwCD3WT7h9OrLkUoJQYjpgmAvYP32Idt97yx0noD81ea8O18NtQeuLDh+Fm1OctIV0KY/3/5N1vdx6zY7j51a7dvVpfLXxON0uwCvZy5wsg1lob7n5iwvvjI0jsvPrrsLtIDcUIwTSB/+7D93te/6bmRyYCEXmrJqivWrnnyN5MPZtexSBdnTFBRnS5/Ybcr2Nzu8E/r8YSq2u3+uharvykQiWbtDSnmUxIqRknYY34nYGgxoXTmIYUPXXNS5Y2kBxKAYJpgHv93+z2vfm35XaJbCthp2P/Nq1pw8qy8v5Mu3rGBZfUEyjpc4Zp2u3dKpzNY1+EM1HQ6/HX9wWgWRdP/He2Nw2M6vKEkoQvmlvzxsqPL7iQ9kCAEE0c7ur1Td1m8TWqF3Fekl3XUm3PWM6ONlNjNe9+bO5/6aJ3rclLGjb3T9uq1M5uysqRO0jVmPB46p8Xtae52hRvbHP7mDoe/tsMVqHYNRPLZwGJfDsmMrmLsk/lMW8ZcuCm54K6USb3/d2rlgmOn571KuoADBFOC1rYOHL74vZbH2hyB/x4bwgzb5TJpuDI/Y1OTOWtVc7nuy2nFhs9yc8fnILlYLKa67LGNK3fb/dNJV9xmTsr+4MFLGk8i5bhjRlkZO7t91RZPoIL5bz6F+ae+3emr7XQFq2MxZlRIMwFFsXPB8Z8SVuRpNt12dtX5kwp0G0kXcIRgSsA7q20LHnin9QGmmbm35wDYO1QUFSnSq3uazZkrmsy6LyZXZKyoNGXvIJ8QXJslWL/gqfUrQpGYnnTFiY4sOMa86Py5JeyfM2WxC+67rIM1Xb3hug6Hb0q7M9jQYffXdrtD5ZFIVMtOBdnpKTvKoiWUVLgRFk3rNArnRUcU3/vLQ4r+xoyacageDxBMcfpwjf3C+9/e/TjXoz/Yb5LcDIWzsUy3sqk8c2VjiW7F5PKsNUJeyO+vts+//52WZxP9ppRKqcE/nVd36uw6/eekSzSYwJJ2OoIVne5AAxNYTZ3OQF27PVjT5fJP8oZiOuYj/7lTmFRYMT98cjMVtnkHFyw5dXrpo3jVN78QTHHo6AtMWrB44+pAOJpLupLHXNgymTRUla/ZwE7/mip0X0wpMHxhNEoHyCd4cdVTm77c1DH4c1LGTauSOhdf1jC3pihL1G8e3pd1cDCv2zbU2On0N7U5g40dzkBthyNQ7fFF2Nem77lZQEZYe9ay2ABjz8zaO+Kipew6F/PfxTO7OmfZ4ZMNr89tML6HEZIwEExxWLh08ydrWweOIaVg2M14pYaMXczUb+Vkc+aXTSXZ3ya7MW9bh2/GFU+tX8l8cyW8hSAnQ2F79LKmw9jNlKRrQnK76ezOvoG6TlewwTkQKnUNhIq8IfYuoYTSqOSD+dnKnjy9qrWxUPN9eaFuOx9bKmBkCKZRbGzrn3PV01u+SvT2Oz9oOjtD3ttUpvtyakXOZz+fovtnoU6X8DNqd7y289nPNzkvZKOPdMXNpFN0/HV+7XEVxVnbSReA4BBMo7j5pe1vfLO193R2MZV0jRsZRQWPn2F65pJ5lX8wSuOf8nW5fCXzH96wg5mjcFofY6d1d59Xc8bMSblfky4AQeFZuRGw5yB9t6vvxFQIJVaUptXvf++4+ooH1q3dZR1sJN2jKjVquw+rz32HXdciXQnxhWKmm57b8cE731mYUReA8BBMI1i2wXViOBJLuaNkHX2hSTc+u+0Ti9sf96kCp83JS+rIjWiM1v31nfYlT3zUdjd7q550AwgCwTSC9W2DR1FUfC+GHGse31DR71/Y8Y6dpkfeU0XMqMz9qiJfu42UnFCURP3qV5abL3xkwxp25zvpBuAdgmkEO23eaVwWjMdKuzMw5eV3W+8l5ahOOMi0hOt07j+YaW27wz/1N09u/PKFz7t+xz7/Rr4CwBsE0wGw33BtNn/c7/gfL+9977h4t3UwrrfqHt6c9QYTs7y8JXgoJsl6+rOuexf8bcPKta3uw0k3AC8QTAdg8QRKI9GYhpQpi137eebT7rjO+ynQ6eyVhZlbSJk0Zqgk22H1z164dNunC5du/mBnNzvCBEgegukALL2hScy/RLHIu2qn5wS711tAyhHNqcl5P+np3E9QirWtAydcvmTDittf2/FCqzOY8iNNSG0IpgOweYIVqby+tC9m2qn87Pu+80g5okPqst8nTd4xs1/N8k298y966IeNVz65cfkXG12nsc+ukS8DxA0XzQFY+sJMMIkFRS3f4j6LFCNqKstZrctQCPvAKUUpN3d65976+s43fvnn71ueX955E3veEvkqwKgQTAdgdQcr2TEAKVNei93XzIxO4trZXVOoXU+agmLXoJwDkfKln3b96dQHVlouemT9mldW9FzLPkxLPgIwLATTAVjd7BqTOKZyrMgQrdjUPjCFlCOqLspYy/860wjYs5GYaV6r3T9zyYcdi8++f2P3aX9c03PPG7ue2dzZN4t8CuA/EEwHYPUE2cVv0WCP5dhp88W16bGmKOO7PUd7jBeaUvR6I0WfrHdeeuWSLavm3rrKf9Zffmi5/fUdL2FdCli4AIbBPiPX54vwd/bSGGDPCur3RvJJOaLqgqx1TJKlxmiQGU3FYrTG1heqXL6x9zx2XerwW1b1X/bY+pUvfdF9w4a2/tns4j75NKQJ0UxVxtJu22DzJY9u3CCmqRz7brjTZ+c/cf0pk64lXSM69o5V3mCE1pIyhTHDJ6k0XFWQsb7JrFtVW5S5+qAy7VdGo7aHfAAmIATTML7Y7Dzltld3vUNKUWCP7j1msuGV286uvYB0jWj+4rWbOxzBuE8oSCVsCJcYVC3N5qwVzD9fNpizv52Up95JvgwTAKZyw7C6Q1WkKR60hFYqZCFSjSovW90xpgvgPGLGsfIed6j2o3XOS/7ydsvzFy1eu/XEe75z/v6FrW+/sLxr0br2gUMx/RM3BNMwrJ5QDWmKik4t85DmqPKzVZ2kKXrMsF82GIgaV+7om/fMsq77rntq01dH3LrKc/lj61ctfq/1wY9+cJxtt8e3Mx5SA4JpGDZPWFR35PagJFSWRu4m1ajyspQTJph+gl1QpyUZ7HN8//zWdv19b+1+7cxHNnSyWxRue3XH62+s6Ll2a493OjOqwlJGikIwDaNnz+Mo4sK+zSNbq7STclTMVK6TDTNSpoG9WxS+2Nx71qMfdiy+4vEN35907xrb717c9q+3VvVc3unyFZMPQgpAMO2H/Slq6wuKcthfqFe2keaocnQK+55XFKUtihoMDOWt2u459eH3O546/6ENu69buuXjzza5TicfgHGEYNqPw+fLDw/RalKKBruPqcigaiXlqFRKykeasJd6XWv/sXe8tvMf8x9eu/Hrbe6TST+MAwTTfqz2WBW7mEpK0VDKqViRXtNNylFp5VIE0zDYv/sOZ7D55he3v3XDs1vfjvc4GeAXgmk/Pf2BStIUlUK9qo2i4n/MRKOU+9hRFilhP+yWhDW7++Zd/NDW9at29gn+slP4Xwim/dg87KkC4lOcq0log6FaG/Wl9xpTfLzBofxFL2x765WvexaSLhgDCKb9WN1h8W2uZJQY1HGvL7FkGRl+0oRRxGg684mPOv605OP2e0gXCAzBtB+LO1BOmqJSZEjskQwDRYWZmRxGTHGiJBLVy19Zblz6aeetpAsEhGDaDzNiEt/mSkapXrODNOPikEjkNC2eh5RTARtOzy3vvvnd1daLSRcIBMG0D/b5KrcvZCCliNB0aZ6qhRRxUfaJ40ULqYaJcvXi99sfwAs/hYVg2kebK1RBx8S3VYBi5mQFOeqEHjGRSlPzDcNiEInS+ttf3/EP5gdZXG9BhsQhmPZhcfsmifExjQK9uosJpygp4+KX+hBMSbC4Q9WPfNB2BymBZwimfVg9Ynozyn+V5KoSPotIRlEIpiT96zvbFfG+BRkSg2Dah90VrN6ziiAyRbnqhNaXWOGQVC7G0WEqicUk2qc/6b6blMAjBNM+rJ6QSDdXqhO6I8cKhKNZ7AsMSAkcrdrpPhGvRucfLsx9WDzi3MNUkpv4sbL9/oieNCEplOLVlT2/JQXwBMG0D2bEVESaolKsV8R93MmPvH4JgoknX29xn+yMxXSkBB4gmIi+vliuLxwT3e1fdkXMXJDZTsq4DQbF9XqqVBaOxHQrV9vjekU7xAfBRHQNBCZRNK0gpWgYMxUWqVQaIGXcegfCohwdpiSKkq7a5cH5TTxCMBHWXl8Fe4GRUjSKDOptpJkQqydQgdMF+LO2deCoWCymIiUkCcFEWPvEeUeu1KjeRZoJcfZHSkkTeBAMR7U7ugLY08QTBBNhc4sxmGi6SK/ZTYqE2PtDZjGOEFMXRe20eZtJAUnChUk4+sPiG0EwU7FigzLhPUysfv9QPmkCTzpdvsmkCUlCMBH9/ojoThVgj8YtTvCAuB/5gtEs0gSe9HqHCkkTkoRgIgaDUREedyKRVBVkJryHiaZpxRATa6QEnngGI3mkCUlCMBGRoajo7qjkahUuLlsFdtu8NVQMwcS3cDSmIU1IEoKJUKvE9zqjYg6PorC2dnhn4wFe/klxVDFvEEyEWi4X3eH8hQZVwtM41m57YJoYT1FIdQqZLEyakCQEE2HUKeN+WWRqoOkSfeLHnbB0GhledimAXJ3CSpqQJAQTUWZM/LC18VZoTPy4E5ZrEI+jCMGYqUQw8QTBRJQaNVtJUyQoqkiv5DRi6nEFRfnuvFRXyOFcLBgegomYXKZdSUskCZ2bPd7MOVmc1pi6e4OiPHcq1ZnzuG12hZ9CMBEVRVnbDCIaimvVMm92trSXlHGjaVrt9uGQOP7RdEmeUnTLAakKwbSP2TXZn5BmyivOVW0nzYS02LzsNA7vlOOZViX35WVmYo2JJwimfZw4I28paaa84lxupwq0O0PVOOubf2VGNacfFDA8XKD7aC7PXllZoNlMypTGBBOnZ+TY96HhHCb+lZo0nM7FguEhmPaz4GjzzaSZ0ko4HhBncQeqSRP4QtOxMiOCiU8Ipv0cUp/73sE1OR+RMmXlGzScRkxdvcFqPI7Cv3KjdhNpAg8QTMP4w7z6c4tyuT3uMVYKDTpOB8RZXOyICY+j8ImWULGSggxOa34wPATTMHJyKM8959XMM+oUFtKVUtRyaaAoS+okZdzYM6l7feI7dyrVyaSScIVRxWkEC8NDMB1AVYFu0/NXzZg2vTLrM+ZnYoR0p4SCXBWn0VKL3VdFxyQyUgJPinNVPRRFpdQ1InYIphHodFLHw5c2HX3v+fVn5GUre0j3uCs1aDht5Ot2B7HwLYASYwZ2fPMMwRSHn9XnvvePG6dXX3hk8Z1yOTXuT+YzP6G5PSPnDNZi4Zt/5Xnc7pDCgSGY4sSeFHnpUeY7nrty6tSDa/QfjOf0rpDjAXE9vezmSkzl+FZiyBDF3jcxQTAlqCxfs/svF9afdPe5NWcW6JVt7CYW8qUxU27Uctpl3OMOivLdeamNpksNOFWAbwgmjg5vNL3z+g0zGi48svR2pVw6SLoFR0noWEll5kZSJgRrTAKgJXR5rg5bBXiGYEoCRVHBS48qu/u1a5objp1qepn54Sn40aoV+dq1JmniQbhnq8BgCFsFeJatVXpycqRuUgJPEEw8MBq13becWX3+/RfUnVpsYI+7FW5611imW0WaCWm3DJYzvyucKsAzMxa+BYFg4tGcOsO/X7l+Wt1VJ5Zfm6Fkz0riN6DYg+yOnWJ8hZQJ6fZEq2kJXgnOt1I8IycIXKg8Y6Z3Q2cfUvzYCzc0NR87xfQCEyYh8qWklRk0O6dUZH9LyoR0e3xYX+IZ+4Oi1KBCMAkAwSQQ9tCwW86queihi+tPKDNptrEXMfkSRzR95qGFD5EiYT047oR/zH9PZsSErQICQDAJbGaV/vMXr5s6+eoTzQszVFIX6U5YXYnuu3mz8p8hZcJc/RG8V59nFEXTkwoycJyuABBMY+DH6d1z1zc2HT3Z8DLTFdz7lfioFVTfTadWXMb873Ae8QwGhwzY9c0vhUwaLNRrukgJPEIwjaECnc5+29m15z96adMvJuVrNjGzsxj50gGpFFL3vefVnVZdqNtCujjxBoeMOFKXXyUGTSfzw2LUv0NIHC7UcTClMuurv18zddq1J0/6rU4jt+8NqJ/ewcvLUbY/eFH9yQdV678gXZz5gkM57NiNlMCDMhN2fAsFF+o4c8Ziuq++s1+8arv7hG5PsIaiKbrUoNn+s3r92yfNyn+e+YnMy6bN8x9ct7OzF8fq8un8uUX3Ljim/BZSAo8QTGniyic3frO5Y3AOM2jCKJknN59Zdc5xU/NeJyXwCBdpmsjWKhzsEbCkBB7gHCbhIJjSRG6mwoa7cvzKL8rgdC4WjA7BlCZqCrQ/YIMlf4xZSjuXh6khPgimNFFTnrmaPTKFlJAks0mN1zUJCMGUJuoLdJtUKpmXlJAU9nA47PgWEoIpjTSVZq4lTUgGMyUuMaqT2vAKI0MwpZEjppheoWnJECkhCeUmBJOQEExpZM4005sKOeUnJXDEbruo0KtwnK6AEExphL2LNKda/3E8z+jBgWmUlM9k0qbkW5onCgRTmjnnZ4UPS6hkz4ZKb6UmDfYvCQzBlGaay7NXTqvM+YaUwIHZhB3fQkMwpaHLjiq5BYvg3JUa8AICoSGY0hA7ajqsPvdfWGvipiwvA3fkBIZgSlOL5tVemaNT4PRFDsxGFTZXCgzBlKaysijXDadUXMeMmgR/SedEQlGSaGW+FovfAkMwpTH2Nee/nFP0JKZ08cvPVtqkUmmAlCAQBFOau+ak8utOmpn3PClhFOa8DDy8OwYQTGmOffPKTadVXX54k+HN5N99N9GxD+9qsFVgDCCYgA2n6F3n1JxzzqFFDzPhxNubgycamqaipUbNVlKCgBBMsAcbTledUH7j/fNrTzVlKVux7vRT7AsuzQa8eXcsIJjgfxxSZ/jojZumN110ZOldchk1QLqBwT68OylPh6ncGEAwwU+wd50uObrszueumjrj4Oqcj7FLfC+dWu7Lzpb2khIEhGCCAyrL1+z+y0UNx/1xft0ZhTnK3ek+vSszalpJEwSGYIJRHVaf++6rN0xv+vUvyv6gVsg8pDvtmPNUeEZujCCYIC7M9C503uGlf3rlpqbmY6aYXkrHu3clBs120gSBIZggIUattufWs6rnP3xx/YnmPPWWdNr7ZM7TbiRNEBiCCTiZUaX/7IVrp0299gTzb7VKqZN0T2jFRrwZZazgzayQNOvgYN7Sj6x//WS960ymVO/tnViklCS2/O45Goqi8NDzGMCICZJWqNM5bjmz5oKHL206rrJAs3kiTu9KDOp2hNLYQTABb6ZXZn357NVTp944r/JKnUZuJ90TQqkRh8ONJQQT8Ip9tGXerIKnXrrqoLrTZxc+ylxgQfIlEaPpMhPuyI0lBBMIQq+n+haeXHHt41dOPrShNHM1+81NviRKpSY1jjsZQwgmEFRDcebaJ37dPHvR6VUX6jMUNtItLrSELjNic+VYQjCB4JjpHX38jPwXly6aUXv67IK/UZREXIvIlCRapM3CVoExhGCCMWOUSgcWnlx59TO/mTynuUz3rVimd3qt0m00SnHSwhhCMMGYq2amd3/7dfOcP55Xd7IpW9FJulNWbUnmD6QJYwTBBOPm0AbDB2/eNLP+wiOK71HIpF7SnXIaSrSrSRPGCIIJxhVFUf5Ljzbf+vw1U2ceVJX9SSoerTJ9kuED0oQxgkdSIKWs2Oo+afGHrY/ZPGEz6RpXRp2i563fH1RCShgjGDFBSjm0Iff91347vX7+3JL7lCkwvTt+Rj5ebTUOMGKClNXRF5i09MPOPy7f3HsaRUnkpHvMqBVU3xvXH1yF43THHkZMkLLMOZqWu86tPevPF9SeUpyraifdY+bMQwsfRyiND4yYQBRisZjqpS8tN730VdcNwTCdQ7oFU5Sranvl+mmNeB34+EAwgajYvd6Cp/5tuf/T9a5zmVKQ6Z1KTvUvXtB8JPs4DemCMYZgAlFas8sz95EP2p/ocPprmcuYt+uY3U9153nVZx9Wa/iQdME4QDCBaNE0LX99pfW6Fz/v+t1gMGoi3Zzp1DLnHefUnH1QtX456YJxgmAC0bPTdObbn3Te8tZ31l8HQjEO6080Pas6Z9mikysuNRgyukgnjCMEE0wY7AL522uclyxbbz9vS7dvJh2jVeRLw5JSkvDMquzl5xxW9OeZVfrPSTekAAQTTEguVyxrs613brsjOLOrN1AdCMcyIxFala2VuY06paWuOPObKSWGz9kD7cgvAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABeSCT/D1dkzKGVXZXHAAAAAElFTkSuQmCC',
    width: 800,
    height: 600,
    center: true,
    content: 'https://vtron.site/gpt/#/about',
    backgroundColor: '#f9f9f9',
    resizable: true,
  },

  {
    title: 'NoteMd',
    icon: markdownicon,
    width: 800,
    height: 600,
    center: true,
    content: NoteMd,

    resizable: true,
  },
  {
    title: 'Flow-epub阅读器',
    icon: flowicon,
    width: 800,
    height: 600,
    center: true,
    content: 'https://app.flowoss.com/zh-CN',
    resizable: true,
  },

  // {
  //   title: '图库',
  //   icon: galleryicon,
  //   width: 800,
  //   height: 600,
  //   center: true,
  //   content: Gallery,

  //   resizable: true,
  // },
  {
    title: '创建网络链接',
    icon: signalicon,
    width: 400,
    height: 400,
    center: true,
    content: CreateUrl,
    // backgroundColor: "#71c5cf",
    resizable: false,
  },

  // {
  //   title: "PPT",
  //   icon: ppticon,
  //   width: 770,
  //   height: 600,
  //   center: true,
  //   resizable: true,
  //   content: PPT,
  // },
  {
    title: '文档',
    icon: winv3icon,
    width: 770,
    height: 600,
    content: GotoReadMe,
    resizable: true,
  },
];
export { desktopConfig, magnetConfig };
