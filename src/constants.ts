export const MAX_TOTAL_FILES_SIZE = 96_000_000;
export const DEFAULT_USER_ICON = "/assets/default-user.webp";
export const API_URL = process.env.JS_ENV_API_URL!;
export const API_CDN_URL = process.env.JS_ENV_API_CDN_URL!;
export const CDN_STORAGE = process.env.JS_ENV_CDN_STORAGE!;
export const CREATE_USER_FUNC_URL = process.env.JS_ENV_CREATE_USER_URL!;
export const CREATE_USER_CHAT_FUNC_URL =
  process.env.JS_ENV_CREATE_USER_CHAT_URL!;
export const FIRESTORE_BASE_URL = process.env.JS_ENV_FB_FIRESTORE_URL!;
// export const FIRERTDB_BASE_URL = process.env.JS_ENV_FB_FIRERTDB_URL!;

export const MAX_PFP_CONTENT_SIZE = Number(
  process.env.JS_ENV_PFP_SIZE ?? 1 * 1024 * 1024,
);

export const MOBILE_MAX_WIDTH_PX = 880;
export const LUPYD_VERSION = process.env.LUPYD_VERSION!;

export const ASCII_LOGO = `
                                         ++≈                                                        
                                π∞√π   π++++                                                        
                              ++++++++≈++π++                                                        
                              π++    +++  ++=                                                       
                               ++=  ×++    +++                                                      
                               ++÷π+++      π+++π                                                   
                               ++++++π        π+++≈                                                 
                            π-+++×≠++            +++-                                               
                      ≈-++++++∞   ++π   √+         ≈+++                                             
                =+++++++=π        ++    +π           π+++          +++++≈                           
                ++√               ++   =+         ++   π++√      =++π  ++×                          
                 +++π  ≠++++++√   ++   +=          ++    ++√    √++++   ++                          
                   +++++-π  π++++√++   +π           +×    ++    ++π ++  ++π                         
                 π+++≠          ++++≠  +π            +π   ÷++   ++   +π ++                          
                +++++√            =++  +π            -+   π++   ++≠    +++                          
                   ≈+++++          ++- +×            π+    ++    +++≈×++-                           
                       π+++         ++≈∞+             +π  π++     ++++≠                             
                          +++        ++×+√            +π  ++≈     ++                                
                           ≈++π       ++++            +π √++     √++                                
                             +++       π+++           + π++      -+÷                                
                              ÷++π       π+++=       ÷+≈++       ++≈                                
                                +++         ÷++++=π π++++        ++≈                                
                                 √+++√         π-++++++∞++×      ÷+-                                
                                    +++++++--++++++-     ×++∞    π++                                
                                        π×++++=π           +++π   ++π                               
                                                      π√∞∞√π +++  ≠++                               
                                                π+++++++++++++++++ ++π                              
                                             ≈++++√           π÷+++-++                              
                                           +++-     ++-=≈∞∞≠-++++√=++++                             
                                         +++π                    π++++++                            
                                       +++π≠+++++++++++++++++++++++-π√+++≈                          
                                     π+++++++∞                    ≈++++++++                         
                                     ∞+∞                               √+++++                       
                                                                           -+×                      
`;

export const rawBoldRegex = /(?<!\\)\*\*\*(.*?)(?<!\\)\*\*\*/gm;
export const rawItalicRegex = /(?<!\\)\/\/\/(.*?)(?<!\\)\/\/\//gm;
export const rawUnderlineRegex = /(?<!\\)___(.*?)(?<!\\)___/gm;
export const rawHeaderRegex = /(?<!\\)###(.*?)(?<!\\)###/gm;
export const rawCodeRegex = /(?<!\\)"""(.*?)(?<!\\)"""/gm;
export const rawHashtagRegex = /(?<!\\)#\w+/gm;
export const rawMentionRegex = /(?<!\\)@\w+/gm;

export const rawUsernameRegex = /^[0-9a-zA-Z_]{3,30}$/gm;
export const rawQuoteRegex = /^>\|\s.*$/gm;
// export const rawHyperLinkRegex = /\[(.+)\]\((.+)\)/gm
export const rawHyperLinkRegex = /\[[^\]]+\]\([^)]+\)/gm;
export const rawEmailRegex = /[\w-\.]+@([\w-]+\.)+[\w-]{2,4}/gm;

export const FIREBASE_CONFIG = JSON.parse(
  atob(process.env.JS_ENV_FIREBASE_CONFIG!),
);
