"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("_app-pages-browser_src_components_HomePage_tsx",{

/***/ "(app-pages-browser)/./src/components/SectionHeader.tsx":
/*!******************************************!*\
  !*** ./src/components/SectionHeader.tsx ***!
  \******************************************/
/***/ (function(module, __webpack_exports__, __webpack_require__) {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _barrel_optimize_names_ChevronRight_Rss_Search_lucide_react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! __barrel_optimize__?names=ChevronRight,Rss,Search!=!lucide-react */ \"(app-pages-browser)/./node_modules/lucide-react/dist/esm/icons/chevron-right.js\");\n/* harmony import */ var _barrel_optimize_names_ChevronRight_Rss_Search_lucide_react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! __barrel_optimize__?names=ChevronRight,Rss,Search!=!lucide-react */ \"(app-pages-browser)/./node_modules/lucide-react/dist/esm/icons/search.js\");\n/* harmony import */ var _barrel_optimize_names_ChevronRight_Rss_Search_lucide_react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! __barrel_optimize__?names=ChevronRight,Rss,Search!=!lucide-react */ \"(app-pages-browser)/./node_modules/lucide-react/dist/esm/icons/rss.js\");\n/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/link */ \"(app-pages-browser)/./node_modules/next/dist/api/link.js\");\n\n\n\n\nconst SectionHeader = (param)=>{\n    let { title, showRssIcon = false, showMoreLink = false, moreLinkUrl = \"#\", categoryUrl, horizontalScroll = false, showSearchIcon = false, onSearchClick = ()=>{} } = param;\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n        className: \"flex items-center justify-between py-2\",\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                className: \"flex items-center\",\n                children: [\n                    categoryUrl ? /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_link__WEBPACK_IMPORTED_MODULE_2__[\"default\"], {\n                        href: categoryUrl,\n                        className: \"group\",\n                        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"h2\", {\n                            className: \"text-lg font-bold group-hover:text-gray-700 transition-colors flex items-center\",\n                            children: [\n                                title,\n                                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_ChevronRight_Rss_Search_lucide_react__WEBPACK_IMPORTED_MODULE_3__[\"default\"], {\n                                    className: \"h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity\"\n                                }, void 0, false, {\n                                    fileName: \"C:\\\\Users\\\\tanig\\\\Downloads\\\\promptver1\\\\src\\\\components\\\\SectionHeader.tsx\",\n                                    lineNumber: 33,\n                                    columnNumber: 15\n                                }, undefined)\n                            ]\n                        }, void 0, true, {\n                            fileName: \"C:\\\\Users\\\\tanig\\\\Downloads\\\\promptver1\\\\src\\\\components\\\\SectionHeader.tsx\",\n                            lineNumber: 31,\n                            columnNumber: 13\n                        }, undefined)\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\tanig\\\\Downloads\\\\promptver1\\\\src\\\\components\\\\SectionHeader.tsx\",\n                        lineNumber: 30,\n                        columnNumber: 11\n                    }, undefined) : /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"h2\", {\n                        className: \"text-lg font-bold\",\n                        children: title\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\tanig\\\\Downloads\\\\promptver1\\\\src\\\\components\\\\SectionHeader.tsx\",\n                        lineNumber: 37,\n                        columnNumber: 11\n                    }, undefined),\n                    showMoreLink && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_link__WEBPACK_IMPORTED_MODULE_2__[\"default\"], {\n                        href: moreLinkUrl,\n                        className: \"ml-2 flex items-center text-sm text-gray-500 hover:text-gray-700\",\n                        children: [\n                            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"span\", {\n                                className: \"hidden md:inline-block ml-1\",\n                                children: \"もっと見る\"\n                            }, void 0, false, {\n                                fileName: \"C:\\\\Users\\\\tanig\\\\Downloads\\\\promptver1\\\\src\\\\components\\\\SectionHeader.tsx\",\n                                lineNumber: 41,\n                                columnNumber: 13\n                            }, undefined),\n                            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_ChevronRight_Rss_Search_lucide_react__WEBPACK_IMPORTED_MODULE_3__[\"default\"], {\n                                className: \"h-4 w-4\"\n                            }, void 0, false, {\n                                fileName: \"C:\\\\Users\\\\tanig\\\\Downloads\\\\promptver1\\\\src\\\\components\\\\SectionHeader.tsx\",\n                                lineNumber: 42,\n                                columnNumber: 13\n                            }, undefined)\n                        ]\n                    }, void 0, true, {\n                        fileName: \"C:\\\\Users\\\\tanig\\\\Downloads\\\\promptver1\\\\src\\\\components\\\\SectionHeader.tsx\",\n                        lineNumber: 40,\n                        columnNumber: 11\n                    }, undefined)\n                ]\n            }, void 0, true, {\n                fileName: \"C:\\\\Users\\\\tanig\\\\Downloads\\\\promptver1\\\\src\\\\components\\\\SectionHeader.tsx\",\n                lineNumber: 28,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                className: \"flex-1 flex justify-center\",\n                children: showSearchIcon && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"button\", {\n                    onClick: onSearchClick,\n                    className: \"text-gray-500 hover:text-gray-700 focus:outline-none\",\n                    \"aria-label\": \"検索\",\n                    children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_ChevronRight_Rss_Search_lucide_react__WEBPACK_IMPORTED_MODULE_4__[\"default\"], {\n                        className: \"h-5 w-5\"\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\tanig\\\\Downloads\\\\promptver1\\\\src\\\\components\\\\SectionHeader.tsx\",\n                        lineNumber: 55,\n                        columnNumber: 13\n                    }, undefined)\n                }, void 0, false, {\n                    fileName: \"C:\\\\Users\\\\tanig\\\\Downloads\\\\promptver1\\\\src\\\\components\\\\SectionHeader.tsx\",\n                    lineNumber: 50,\n                    columnNumber: 11\n                }, undefined)\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\tanig\\\\Downloads\\\\promptver1\\\\src\\\\components\\\\SectionHeader.tsx\",\n                lineNumber: 48,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                children: showRssIcon && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_link__WEBPACK_IMPORTED_MODULE_2__[\"default\"], {\n                    href: \"/rss\",\n                    className: \"text-gray-500 hover:text-gray-700\",\n                    children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_ChevronRight_Rss_Search_lucide_react__WEBPACK_IMPORTED_MODULE_5__[\"default\"], {\n                        className: \"h-5 w-5\"\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\tanig\\\\Downloads\\\\promptver1\\\\src\\\\components\\\\SectionHeader.tsx\",\n                        lineNumber: 64,\n                        columnNumber: 13\n                    }, undefined)\n                }, void 0, false, {\n                    fileName: \"C:\\\\Users\\\\tanig\\\\Downloads\\\\promptver1\\\\src\\\\components\\\\SectionHeader.tsx\",\n                    lineNumber: 63,\n                    columnNumber: 11\n                }, undefined)\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\tanig\\\\Downloads\\\\promptver1\\\\src\\\\components\\\\SectionHeader.tsx\",\n                lineNumber: 61,\n                columnNumber: 7\n            }, undefined)\n        ]\n    }, void 0, true, {\n        fileName: \"C:\\\\Users\\\\tanig\\\\Downloads\\\\promptver1\\\\src\\\\components\\\\SectionHeader.tsx\",\n        lineNumber: 27,\n        columnNumber: 5\n    }, undefined);\n};\n_c = SectionHeader;\n/* harmony default export */ __webpack_exports__[\"default\"] = (SectionHeader);\nvar _c;\n$RefreshReg$(_c, \"SectionHeader\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL3NyYy9jb21wb25lbnRzL1NlY3Rpb25IZWFkZXIudHN4IiwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUEwQjtBQUMrQjtBQUM1QjtBQWE3QixNQUFNSyxnQkFBOEM7UUFBQyxFQUNuREMsS0FBSyxFQUNMQyxjQUFjLEtBQUssRUFDbkJDLGVBQWUsS0FBSyxFQUNwQkMsY0FBYyxHQUFHLEVBQ2pCQyxXQUFXLEVBQ1hDLG1CQUFtQixLQUFLLEVBQ3hCQyxpQkFBaUIsS0FBSyxFQUN0QkMsZ0JBQWdCLEtBQU8sQ0FBQyxFQUN6QjtJQUNDLHFCQUNFLDhEQUFDQztRQUFJQyxXQUFVOzswQkFDYiw4REFBQ0Q7Z0JBQUlDLFdBQVU7O29CQUNaTCw0QkFDQyw4REFBQ04saURBQUlBO3dCQUFDWSxNQUFNTjt3QkFBYUssV0FBVTtrQ0FDakMsNEVBQUNFOzRCQUFHRixXQUFVOztnQ0FDWFQ7OENBQ0QsOERBQUNMLG1HQUFZQTtvQ0FBQ2MsV0FBVTs7Ozs7Ozs7Ozs7Ozs7OztrREFJNUIsOERBQUNFO3dCQUFHRixXQUFVO2tDQUFxQlQ7Ozs7OztvQkFFcENFLDhCQUNDLDhEQUFDSixpREFBSUE7d0JBQUNZLE1BQU1QO3dCQUFhTSxXQUFVOzswQ0FDakMsOERBQUNHO2dDQUFLSCxXQUFVOzBDQUE4Qjs7Ozs7OzBDQUM5Qyw4REFBQ2QsbUdBQVlBO2dDQUFDYyxXQUFVOzs7Ozs7Ozs7Ozs7Ozs7Ozs7MEJBTTlCLDhEQUFDRDtnQkFBSUMsV0FBVTswQkFDWkgsZ0NBQ0MsOERBQUNPO29CQUNDQyxTQUFTUDtvQkFDVEUsV0FBVTtvQkFDVk0sY0FBVzs4QkFFWCw0RUFBQ2xCLG1HQUFNQTt3QkFBQ1ksV0FBVTs7Ozs7Ozs7Ozs7Ozs7OzswQkFNeEIsOERBQUNEOzBCQUNFUCw2QkFDQyw4REFBQ0gsaURBQUlBO29CQUFDWSxNQUFLO29CQUFPRCxXQUFVOzhCQUMxQiw0RUFBQ2IsbUdBQUdBO3dCQUFDYSxXQUFVOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBTTNCO0tBdERNVjtBQXdETiwrREFBZUEsYUFBYUEsRUFBQyIsInNvdXJjZXMiOlsid2VicGFjazovL19OX0UvLi9zcmMvY29tcG9uZW50cy9TZWN0aW9uSGVhZGVyLnRzeD81NzY3Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IENoZXZyb25SaWdodCwgUnNzLCBTZWFyY2ggfSBmcm9tICdsdWNpZGUtcmVhY3QnO1xyXG5pbXBvcnQgTGluayBmcm9tICduZXh0L2xpbmsnO1xyXG5cclxuaW50ZXJmYWNlIFNlY3Rpb25IZWFkZXJQcm9wcyB7XHJcbiAgdGl0bGU6IHN0cmluZztcclxuICBzaG93UnNzSWNvbj86IGJvb2xlYW47XHJcbiAgc2hvd01vcmVMaW5rPzogYm9vbGVhbjtcclxuICBtb3JlTGlua1VybD86IHN0cmluZztcclxuICBjYXRlZ29yeVVybD86IHN0cmluZzsgLy8g44Kr44OG44K044Oq44Oa44O844K444G444GuVVJMXHJcbiAgaG9yaXpvbnRhbFNjcm9sbD86IGJvb2xlYW47XHJcbiAgc2hvd1NlYXJjaEljb24/OiBib29sZWFuO1xyXG4gIG9uU2VhcmNoQ2xpY2s/OiAoKSA9PiB2b2lkO1xyXG59XHJcblxyXG5jb25zdCBTZWN0aW9uSGVhZGVyOiBSZWFjdC5GQzxTZWN0aW9uSGVhZGVyUHJvcHM+ID0gKHtcclxuICB0aXRsZSxcclxuICBzaG93UnNzSWNvbiA9IGZhbHNlLFxyXG4gIHNob3dNb3JlTGluayA9IGZhbHNlLFxyXG4gIG1vcmVMaW5rVXJsID0gJyMnLFxyXG4gIGNhdGVnb3J5VXJsLFxyXG4gIGhvcml6b250YWxTY3JvbGwgPSBmYWxzZSxcclxuICBzaG93U2VhcmNoSWNvbiA9IGZhbHNlLFxyXG4gIG9uU2VhcmNoQ2xpY2sgPSAoKSA9PiB7fSxcclxufSkgPT4ge1xyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBweS0yXCI+XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXJcIj5cclxuICAgICAgICB7Y2F0ZWdvcnlVcmwgPyAoXHJcbiAgICAgICAgICA8TGluayBocmVmPXtjYXRlZ29yeVVybH0gY2xhc3NOYW1lPVwiZ3JvdXBcIj5cclxuICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1ib2xkIGdyb3VwLWhvdmVyOnRleHQtZ3JheS03MDAgdHJhbnNpdGlvbi1jb2xvcnMgZmxleCBpdGVtcy1jZW50ZXJcIj5cclxuICAgICAgICAgICAgICB7dGl0bGV9XHJcbiAgICAgICAgICAgICAgPENoZXZyb25SaWdodCBjbGFzc05hbWU9XCJoLTQgdy00IG1sLTEgb3BhY2l0eS0wIGdyb3VwLWhvdmVyOm9wYWNpdHktMTAwIHRyYW5zaXRpb24tb3BhY2l0eVwiIC8+XHJcbiAgICAgICAgICAgIDwvaDI+XHJcbiAgICAgICAgICA8L0xpbms+XHJcbiAgICAgICAgKSA6IChcclxuICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtYm9sZFwiPnt0aXRsZX08L2gyPlxyXG4gICAgICAgICl9XHJcbiAgICAgICAge3Nob3dNb3JlTGluayAmJiAoXHJcbiAgICAgICAgICA8TGluayBocmVmPXttb3JlTGlua1VybH0gY2xhc3NOYW1lPVwibWwtMiBmbGV4IGl0ZW1zLWNlbnRlciB0ZXh0LXNtIHRleHQtZ3JheS01MDAgaG92ZXI6dGV4dC1ncmF5LTcwMFwiPlxyXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJoaWRkZW4gbWQ6aW5saW5lLWJsb2NrIG1sLTFcIj7jgoLjgaPjgajopovjgos8L3NwYW4+XHJcbiAgICAgICAgICAgIDxDaGV2cm9uUmlnaHQgY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+XHJcbiAgICAgICAgICA8L0xpbms+XHJcbiAgICAgICAgKX1cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIFxyXG4gICAgICB7Lyog5qSc57Si44Ki44Kk44Kz44Oz77yI5Lit5aSu44Gr6YWN572u77yJICovfVxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGp1c3RpZnktY2VudGVyXCI+XHJcbiAgICAgICAge3Nob3dTZWFyY2hJY29uICYmIChcclxuICAgICAgICAgIDxidXR0b24gXHJcbiAgICAgICAgICAgIG9uQ2xpY2s9e29uU2VhcmNoQ2xpY2t9XHJcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQtZ3JheS01MDAgaG92ZXI6dGV4dC1ncmF5LTcwMCBmb2N1czpvdXRsaW5lLW5vbmVcIlxyXG4gICAgICAgICAgICBhcmlhLWxhYmVsPVwi5qSc57SiXCJcclxuICAgICAgICAgID5cclxuICAgICAgICAgICAgPFNlYXJjaCBjbGFzc05hbWU9XCJoLTUgdy01XCIgLz5cclxuICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICBcclxuICAgICAgey8qIOWPs+WBtOOBrlJTU+OCouOCpOOCs+ODsyAqL31cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7c2hvd1Jzc0ljb24gJiYgKFxyXG4gICAgICAgICAgPExpbmsgaHJlZj1cIi9yc3NcIiBjbGFzc05hbWU9XCJ0ZXh0LWdyYXktNTAwIGhvdmVyOnRleHQtZ3JheS03MDBcIj5cclxuICAgICAgICAgICAgPFJzcyBjbGFzc05hbWU9XCJoLTUgdy01XCIgLz5cclxuICAgICAgICAgIDwvTGluaz5cclxuICAgICAgICApfVxyXG4gICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PlxyXG4gICk7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTZWN0aW9uSGVhZGVyO1xyXG4iXSwibmFtZXMiOlsiUmVhY3QiLCJDaGV2cm9uUmlnaHQiLCJSc3MiLCJTZWFyY2giLCJMaW5rIiwiU2VjdGlvbkhlYWRlciIsInRpdGxlIiwic2hvd1Jzc0ljb24iLCJzaG93TW9yZUxpbmsiLCJtb3JlTGlua1VybCIsImNhdGVnb3J5VXJsIiwiaG9yaXpvbnRhbFNjcm9sbCIsInNob3dTZWFyY2hJY29uIiwib25TZWFyY2hDbGljayIsImRpdiIsImNsYXNzTmFtZSIsImhyZWYiLCJoMiIsInNwYW4iLCJidXR0b24iLCJvbkNsaWNrIiwiYXJpYS1sYWJlbCJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(app-pages-browser)/./src/components/SectionHeader.tsx\n"));

/***/ })

});