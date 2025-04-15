//@ts-nocheck

import { API_URL } from "../constants"
import { AdResponse } from "../protos/ads"


export namespace Ads {

    // export function showAd(id: string) {
    //     window.googletag = window.googletag || { cmd: [] };
    //     googletag.cmd.push(function () {
    //         googletag
    //             .defineSlot(
    //                 '/6355419/Travel/Europe/France/Paris', [300, 250], id)
    //             .addService(googletag.pubads());
    //         googletag.enableServices();
    //     });
    //     console.log("activated ad ", id)
    // }

    // export function bannerAd(id: string) {
    //     const div = document.createElement("div");
    //     div.style = "width: 300px; height: 250px; margin: 0 auto;";
    //     div.setAttribute("id", id)
    //     div.innerHTML = `
    //     <script>
    //     googletag.cmd.push(function() {
    //       googletag.display('${id}');
    //     });
    //     </script>
    //     `
    //     return div;
    // }

   //  export function inFeedAd() {
   //      const html = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6050025830397443"
   //      crossorigin="anonymous"></script>
   // <ins class="adsbygoogle"
   //      style="display:block"
   //      data-ad-format="fluid"
   //      data-ad-layout-key="-6q+ek+16-3w+4d"
   //      data-ad-client="ca-pub-6050025830397443"
   //      data-ad-slot="6486858701"></ins>
   // <script>
   //      (adsbygoogle = window.adsbygoogle || []).push({});
   // </script>`

   //      export function displayAd() {
   //          const html = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6050025830397443"
   //          crossorigin="anonymous"></script>
   //     <!-- display_ad -->
   //     <ins class="adsbygoogle"
   //          style="display:block"
   //          data-ad-client="ca-pub-6050025830397443"
   //          data-ad-slot="9333502601"
   //          data-ad-format="auto"
   //          data-full-width-responsive="true"></ins>
   //     <script>
   //          (adsbygoogle = window.adsbygoogle || []).push({});
   //     </script>`
   //      }

   //      export function bannerAd() {
   //          const html = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6050025830397443"
   //          crossorigin="anonymous"></script>
   //     <ins class="adsbygoogle"
   //          style="display:block"
   //          data-ad-format="autorelaxed"
   //          data-ad-client="ca-pub-6050025830397443"
   //          data-ad-slot="1979123747"></ins>
   //     <script>
   //          (adsbygoogle = window.adsbygoogle || []).push({});
   //     </script>`
   //      }
   //  }
}


export const getAds = async () =>  {
  const response = await fetch(`${API_URL}/ads`)
  const body = new Uint8Array(await response.arrayBuffer())

  return AdResponse.decode(body)
}
