"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIREBASE_CONFIG = exports.rawEmailRegex = exports.rawHyperLinkRegex = exports.rawQuoteRegex = exports.rawUsernameRegex = exports.rawMentionRegex = exports.rawHashtagRegex = exports.rawCodeRegex = exports.rawHeaderRegex = exports.rawUnderlineRegex = exports.rawItalicRegex = exports.rawBoldRegex = exports.ASCII_LOGO = exports.LUPYD_VERSION = exports.MOBILE_MAX_WIDTH_PX = exports.MAX_PFP_CONTENT_SIZE = exports.FIRESTORE_BASE_URL = exports.CREATE_USER_CHAT_FUNC_URL = exports.CREATE_USER_FUNC_URL = exports.CDN_STORAGE = exports.API_CDN_URL = exports.API_URL = exports.DEFAULT_USER_ICON = exports.MAX_TOTAL_FILES_SIZE = void 0;
exports.MAX_TOTAL_FILES_SIZE = 96_000_000;
exports.DEFAULT_USER_ICON = "/assets/default-user.webp";
exports.API_URL = process.env.JS_ENV_API_URL;
exports.API_CDN_URL = process.env.JS_ENV_API_CDN_URL;
exports.CDN_STORAGE = process.env.JS_ENV_CDN_STORAGE;
exports.CREATE_USER_FUNC_URL = process.env.JS_ENV_CREATE_USER_URL;
exports.CREATE_USER_CHAT_FUNC_URL = process.env.JS_ENV_CREATE_USER_CHAT_URL;
exports.FIRESTORE_BASE_URL = process.env.JS_ENV_FB_FIRESTORE_URL;
// export const FIRERTDB_BASE_URL = process.env.JS_ENV_FB_FIRERTDB_URL!;
exports.MAX_PFP_CONTENT_SIZE = Number(process.env.JS_ENV_PFP_SIZE ?? 1 * 1024 * 1024);
exports.MOBILE_MAX_WIDTH_PX = 880;
exports.LUPYD_VERSION = process.env.LUPYD_VERSION;
exports.ASCII_LOGO = `
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
exports.rawBoldRegex = /(?<!\\)\*\*\*(.*?)(?<!\\)\*\*\*/gm;
exports.rawItalicRegex = /(?<!\\)\/\/\/(.*?)(?<!\\)\/\/\//gm;
exports.rawUnderlineRegex = /(?<!\\)___(.*?)(?<!\\)___/gm;
exports.rawHeaderRegex = /(?<!\\)###(.*?)(?<!\\)###/gm;
exports.rawCodeRegex = /(?<!\\)"""(.*?)(?<!\\)"""/gm;
exports.rawHashtagRegex = /(?<!\\)#\w+/gm;
exports.rawMentionRegex = /(?<!\\)@\w+/gm;
exports.rawUsernameRegex = /^[0-9a-zA-Z_]{3,30}$/gm;
exports.rawQuoteRegex = /^>\|\s.*$/gm;
// export const rawHyperLinkRegex = /\[(.+)\]\((.+)\)/gm
exports.rawHyperLinkRegex = /\[[^\]]+\]\([^)]+\)/gm;
exports.rawEmailRegex = /[\w-\.]+@([\w-]+\.)+[\w-]{2,4}/gm;
exports.FIREBASE_CONFIG = JSON.parse(atob(process.env.JS_ENV_FIREBASE_CONFIG));
