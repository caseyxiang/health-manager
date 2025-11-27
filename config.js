// å¥åº·ç®¡å®¶ Pro - é…ç½®æ–‡ä»¶
// Version: v15.71

const VERSION = "v15.71";

// Inline SVG Icons
const Icons = {
  Menu: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("line", {x1:"4", x2:"20", y1:"12", y2:"12"}), React.createElement("line", {x1:"4", x2:"20", y1:"6", y2:"6"}), React.createElement("line", {x1:"4", x2:"20", y1:"18", y2:"18"})),
  Activity: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M22 12h-4l-3 9L9 3l-3 9H2"})),
  Plus: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2.5", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M5 12h14"}), React.createElement("path", {d:"M12 5v14"})),
  X: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M18 6 6 18"}), React.createElement("path", {d:"m6 6 12 12"})),
  Save: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"}), React.createElement("polyline", {points:"17 21 17 13 7 13 7 21"}), React.createElement("polyline", {points:"7 3 7 8 15 8"})),
  Trash2: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M3 6h18"}), React.createElement("path", {d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"}), React.createElement("path", {d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"}), React.createElement("line", {x1:"10", x2:"10", y1:"11", y2:"17"}), React.createElement("line", {x1:"14", x2:"14", y1:"11", y2:"17"})),
  Clock: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("circle", {cx:"12", cy:"12", r:"10"}), React.createElement("polyline", {points:"12 6 12 12 16 14"})),
  Calendar: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("rect", {width:"18", height:"18", x:"3", y:"4", rx:"2", ry:"2"}), React.createElement("line", {x1:"16", x2:"16", y1:"2", y2:"6"}), React.createElement("line", {x1:"8", x2:"8", y1:"2", y2:"6"}), React.createElement("line", {x1:"3", x2:"21", y1:"10", y2:"10"})),
  Library: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"m16 6 4 14"}), React.createElement("path", {d:"M12 6v14"}), React.createElement("path", {d:"M8 8v12"}), React.createElement("path", {d:"M4 4v16"})),
  FileSpreadsheet: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"}), React.createElement("polyline", {points:"14 2 14 8 20 8"}), React.createElement("path", {d:"M8 13h2"}), React.createElement("path", {d:"M8 17h2"}), React.createElement("path", {d:"M14 13h2"}), React.createElement("path", {d:"M14 17h2"})),
  FileImage: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"}), React.createElement("polyline", {points:"14 2 14 8 20 8"}), React.createElement("circle", {cx:"10", cy:"13", r:"2"}), React.createElement("path", {d:"m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22"})),
  LayoutList: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("rect", {width:"7", height:"7", x:"3", y:"3", rx:"1"}), React.createElement("rect", {width:"7", height:"7", x:"3", y:"14", rx:"1"}), React.createElement("path", {d:"M14 4h7"}), React.createElement("path", {d:"M14 9h7"}), React.createElement("path", {d:"M14 15h7"}), React.createElement("path", {d:"M14 20h7"})),
  LayoutGrid: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("rect", {width:"7", height:"7", x:"3", y:"3", rx:"1"}), React.createElement("rect", {width:"7", height:"7", x:"14", y:"3", rx:"1"}), React.createElement("rect", {width:"7", height:"7", x:"14", y:"14", rx:"1"}), React.createElement("rect", {width:"7", height:"7", x:"3", y:"14", rx:"1"})),
  ScanLine: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M3 7V5a2 2 0 0 1 2-2h2"}), React.createElement("path", {d:"M17 3h2a2 2 0 0 1 2 2v2"}), React.createElement("path", {d:"M21 17v2a2 2 0 0 1-2 2h-2"}), React.createElement("path", {d:"M7 21H5a2 2 0 0 1-2-2v-2"}), React.createElement("line", {x1:"7", x2:"17", y1:"12", y2:"12"})),
  BarChart2: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("line", {x1:"18", x2:"18", y1:"20", y2:"10"}), React.createElement("line", {x1:"12", x2:"12", y1:"20", y2:"4"}), React.createElement("line", {x1:"6", x2:"6", y1:"20", y2:"14"})),
  ChevronDown: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"m6 9 6 6 6-6"})),
  ChevronUp: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"m18 15-6-6-6 6"})),
  ChevronRight: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"m9 18 6-6-6-6"})),
  Check: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("polyline", {points:"20 6 9 17 4 12"})),
  AlertTriangle: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"}), React.createElement("line", {x1:"12", x2:"12", y1:"9", y2:"13"}), React.createElement("line", {x1:"12", x2:"12.01", y1:"17", y2:"17"})),
  Edit: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"}), React.createElement("path", {d:"M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"})),
  Info: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("circle", {cx:"12", cy:"12", r:"10"}), React.createElement("path", {d:"M12 16v-4"}), React.createElement("path", {d:"M12 8h.01"})),
  ArrowUp: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2.5", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"m5 12 7-7 7 7"}), React.createElement("path", {d:"M12 19V5"})),
  ArrowDown: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2.5", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M12 5v14"}), React.createElement("path", {d:"m19 12-7 7-7-7"})),
  Infinity: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"})),
  Download: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}), React.createElement("polyline", {points:"7 10 12 15 17 10"}), React.createElement("line", {x1:"12", x2:"12", y1:"15", y2:"3"})),
  FileJson: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"}), React.createElement("polyline", {points:"14 2 14 8 20 8"}), React.createElement("path", {d:"M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1"}), React.createElement("path", {d:"M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1"})),
  Upload: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}), React.createElement("polyline", {points:"17 8 12 3 7 8"}), React.createElement("line", {x1:"12", x2:"12", y1:"3", y2:"15"})),
  Loader: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round", className:"animate-spin"}, React.createElement("path", {d:"M21 12a9 9 0 1 1-6.219-8.56"})),
  Settings: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"}), React.createElement("circle", {cx:"12", cy:"12", r:"3"})),
  RefreshCw: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"}), React.createElement("path", {d:"M21 3v5h-5"}), React.createElement("path", {d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"}), React.createElement("path", {d:"M8 21H3v-5"})),
  Printer: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("polyline", {points:"6 9 6 2 18 2 18 9"}), React.createElement("path", {d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"}), React.createElement("rect", {width:"12", height:"8", x:"6", y:"14"})),
  Heart: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"})),
  Thermometer: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"})),
  Scale: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"}), React.createElement("path", {d:"m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"}), React.createElement("path", {d:"M7 21h10"}), React.createElement("path", {d:"M12 3v18"}), React.createElement("path", {d:"M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"})),
  Droplet: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"})),
  Wind: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"}), React.createElement("path", {d:"M9.6 4.6A2 2 0 1 1 11 8H2"}), React.createElement("path", {d:"M12.6 19.4A2 2 0 1 0 14 16H2"})),
  Users: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}), React.createElement("circle", {cx:"9", cy:"7", r:"4"}), React.createElement("path", {d:"M22 21v-2a4 4 0 0 0-3-3.87"}), React.createElement("path", {d:"M16 3.13a4 4 0 0 1 0 7.75"})),
  UserPlus: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}), React.createElement("circle", {cx:"9", cy:"7", r:"4"}), React.createElement("line", {x1:"19", x2:"19", y1:"8", y2:"14"}), React.createElement("line", {x1:"22", x2:"16", y1:"11", y2:"11"})),
  User: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"}), React.createElement("circle", {cx:"12", cy:"7", r:"4"})),
  Eye: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"}), React.createElement("circle", {cx:"12", cy:"12", r:"3"})),
  EyeOff: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M9.88 9.88a3 3 0 1 0 4.24 4.24"}), React.createElement("path", {d:"M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"}), React.createElement("path", {d:"M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"}), React.createElement("line", {x1:"2", x2:"22", y1:"2", y2:"22"})),
  LogIn: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"}), React.createElement("polyline", {points:"10 17 15 12 10 7"}), React.createElement("line", {x1:"15", x2:"3", y1:"12", y2:"12"})),
  LogOut: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"}), React.createElement("polyline", {points:"16 17 21 12 16 7"}), React.createElement("line", {x1:"21", x2:"9", y1:"12", y2:"12"})),
  Cloud: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("path", {d:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"})),
  CloudOff: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap="round", strokeLinejoin:"round"}, React.createElement("path", {d:"m2 2 20 20"}), React.createElement("path", {d:"M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193"}), React.createElement("path", {d:"M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7 7 0 0 0 8 5.07"})),
  Smartphone: (p) => React.createElement("svg", {xmlns:"http://www.w3.org/2000/svg", width:p.size||20, height:p.size||20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round"}, React.createElement("rect", {width:"14", height:"20", x:"5", y:"2", rx:"2", ry:"2"}), React.createElement("path", {d:"M12 18h.01"}))
};

// å•ä½åˆ—è¡¨
const UNITS = ['mg', 'g', 'mcg', 'ml', 'L', 'IU', 'ç‰‡', 'ç²’', 'æ”¯', 'ç“¶', 'ç›’', 'åŒ…'];

// å‰‚åž‹åˆ—è¡¨
const DOSAGE_FORMS = ['ç‰‡å‰‚', 'èƒ¶å›Š', 'é¢—ç²’å‰‚', 'å£æœæ¶²', 'æ³¨å°„å‰‚', 'è½¯è†', 'æ»´å‰‚', 'å–·é›¾å‰‚', 'è´´å‰‚', 'å…¶ä»–'];

// ç”¨é¤å…³ç³»
const RELATIONS = ['æ— å…³', 'é¤å‰', 'éšé¤', 'é¤åŽ'];

// æˆå‘˜å¤´åƒé¢œè‰²é€‰é¡¹
const MEMBER_COLORS = [
  { id: 'indigo', bg: 'bg-indigo-500', text: 'text-white', hex: '#6366f1' },
  { id: 'pink', bg: 'bg-pink-500', text: 'text-white', hex: '#ec4899' },
  { id: 'green', bg: 'bg-green-500', text: 'text-white', hex: '#22c55e' },
  { id: 'orange', bg: 'bg-orange-500', text: 'text-white', hex: '#f97316' },
  { id: 'cyan', bg: 'bg-cyan-500', text: 'text-white', hex: '#06b6d4' },
  { id: 'purple', bg: 'bg-purple-500', text: 'text-white', hex: '#a855f7' }
];

// é»˜è®¤æˆå‘˜ï¼ˆè‡ªå·±ï¼‰
const DEFAULT_MEMBER = { id: 'default', name: 'æˆ‘', relation: 'æœ¬äºº', color: 'indigo' };
const DEFAULT_MEMBERS = [DEFAULT_MEMBER];

// æœè¯æ—¶æ®µ
const TIME_PERIODS = ['æ—©é¤', 'åˆé¤', 'æ™šé¤', 'ç¡å‰'];

// åŒ»å­¦æŒ‡æ ‡è¯å…¸ - é»˜è®¤æ•°æ®
const DEFAULT_MEDICAL_DICTIONARY = [
  { id: '1', cnName: 'ç™½ç»†èƒžè®¡æ•°', cnAliases: ['ç™½ç»†èƒž', 'WBCè®¡æ•°'], enName: 'WBC', enAliases: ['White Blood Cell'], description: 'è¯„ä¼°å…ç–«ç³»ç»ŸåŠŸèƒ½ï¼Œå‡é«˜å¸¸è§äºŽæ„ŸæŸ“ã€ç‚Žç—‡', unit: '10^9/L', normalRange: '4.0-10.0' },
  { id: '2', cnName: 'çº¢ç»†èƒžè®¡æ•°', cnAliases: ['çº¢ç»†èƒž', 'RBCè®¡æ•°'], enName: 'RBC', enAliases: ['Red Blood Cell'], description: 'è¯„ä¼°æºæ°§èƒ½åŠ›ï¼Œåä½Žæç¤ºè´«è¡€', unit: '10^12/L', normalRange: 'ç”·4.0-5.5ï¼Œå¥³3.5-5.0' },
  { id: '3', cnName: 'è¡€çº¢è›‹ç™½', cnAliases: ['è¡€çº¢è›‹ç™½æµ“åº¦'], enName: 'HGB', enAliases: ['Hemoglobin', 'Hb'], description: 'è¯Šæ–­è´«è¡€çš„ä¸»è¦æŒ‡æ ‡', unit: 'g/L', normalRange: 'ç”·120-160ï¼Œå¥³110-150' },
  { id: '4', cnName: 'è¡€å°æ¿è®¡æ•°', cnAliases: ['è¡€å°æ¿', 'PLTè®¡æ•°'], enName: 'PLT', enAliases: ['Platelet'], description: 'è¯„ä¼°å‡è¡€åŠŸèƒ½', unit: '10^9/L', normalRange: '100-300' },
  { id: '5', cnName: 'ä¸­æ€§ç²’ç»†èƒžç™¾åˆ†æ¯”', cnAliases: ['ä¸­æ€§ç²’ç»†èƒž%'], enName: 'NEUT%', enAliases: ['Neutrophil%'], description: 'ç»†èŒæ„ŸæŸ“æ—¶å‡é«˜', unit: '%', normalRange: '50-70' },
  { id: '6', cnName: 'æ·‹å·´ç»†èƒžç™¾åˆ†æ¯”', cnAliases: ['æ·‹å·´ç»†èƒž%'], enName: 'LYMPH%', enAliases: ['Lymphocyte%'], description: 'ç—…æ¯’æ„ŸæŸ“æ—¶å‡é«˜', unit: '%', normalRange: '20-40' },
  { id: '7', cnName: 'ä¸™æ°¨é…¸æ°¨åŸºè½¬ç§»é…¶', cnAliases: ['è°·ä¸™è½¬æ°¨é…¶'], enName: 'ALT', enAliases: ['GPT', 'SGPT'], description: 'è‚åŠŸèƒ½æŒ‡æ ‡ï¼Œå‡é«˜æç¤ºè‚æŸä¼¤', unit: 'U/L', normalRange: '0-40' },
  { id: '8', cnName: 'å¤©é—¨å†¬æ°¨é…¸æ°¨åŸºè½¬ç§»é…¶', cnAliases: ['è°·è‰è½¬æ°¨é…¶'], enName: 'AST', enAliases: ['GOT', 'SGOT'], description: 'è‚åŠŸèƒ½æŒ‡æ ‡ï¼Œå¿ƒè‚ŒæŸä¼¤æ—¶ä¹Ÿå‡é«˜', unit: 'U/L', normalRange: '0-40' },
  { id: '9', cnName: 'æ€»èƒ†çº¢ç´ ', cnAliases: ['èƒ†çº¢ç´ '], enName: 'TBIL', enAliases: ['Total Bilirubin'], description: 'è‚åŠŸèƒ½æŒ‡æ ‡ï¼Œå‡é«˜å‡ºçŽ°é»„ç–¸', unit: 'Î¼mol/L', normalRange: '3.4-20.5' },
  { id: '10', cnName: 'ç›´æŽ¥èƒ†çº¢ç´ ', cnAliases: ['ç»“åˆèƒ†çº¢ç´ '], enName: 'DBIL', enAliases: ['Direct Bilirubin'], description: 'èƒ†é“æ¢—é˜»æ—¶å‡é«˜', unit: 'Î¼mol/L', normalRange: '0-6.8' },
  { id: '11', cnName: 'æ€»è›‹ç™½', cnAliases: ['è¡€æ¸…æ€»è›‹ç™½'], enName: 'TP', enAliases: ['Total Protein'], description: 'è¥å…»çŠ¶æ€å’Œè‚åŠŸèƒ½æŒ‡æ ‡', unit: 'g/L', normalRange: '60-80' },
  { id: '12', cnName: 'ç™½è›‹ç™½', cnAliases: ['è¡€æ¸…ç™½è›‹ç™½'], enName: 'ALB', enAliases: ['Albumin'], description: 'è‚è„åˆæˆåŠŸèƒ½æŒ‡æ ‡', unit: 'g/L', normalRange: '35-55' },
  { id: '13', cnName: 'çƒè›‹ç™½', cnAliases: ['è¡€æ¸…çƒè›‹ç™½'], enName: 'GLO', enAliases: ['Globulin'], description: 'å…ç–«çƒè›‹ç™½', unit: 'g/L', normalRange: '20-35' },
  { id: '14', cnName: 'å°¿ç´ æ°®', cnAliases: ['å°¿ç´ '], enName: 'BUN', enAliases: ['Blood Urea Nitrogen'], description: 'è‚¾åŠŸèƒ½æŒ‡æ ‡', unit: 'mmol/L', normalRange: '2.9-8.2' },
  { id: '15', cnName: 'è‚Œé…', cnAliases: ['è¡€æ¸…è‚Œé…'], enName: 'Cr', enAliases: ['Creatinine'], description: 'è‚¾åŠŸèƒ½é‡è¦æŒ‡æ ‡', unit: 'Î¼mol/L', normalRange: 'ç”·53-106ï¼Œå¥³44-97' },
  { id: '16', cnName: 'å°¿é…¸', cnAliases: ['è¡€å°¿é…¸'], enName: 'UA', enAliases: ['Uric Acid'], description: 'ç—›é£Žè¯Šæ–­æŒ‡æ ‡', unit: 'Î¼mol/L', normalRange: 'ç”·208-428ï¼Œå¥³155-357' },
  { id: '17', cnName: 'è‘¡è„ç³–', cnAliases: ['è¡€ç³–', 'ç©ºè…¹è¡€ç³–'], enName: 'GLU', enAliases: ['Glucose', 'FPG'], description: 'ç³–å°¿ç—…è¯Šæ–­æŒ‡æ ‡', unit: 'mmol/L', normalRange: '3.9-6.1ï¼ˆç©ºè…¹ï¼‰' },
  { id: '18', cnName: 'ç”˜æ²¹ä¸‰é…¯', cnAliases: ['ä¸‰é…°ç”˜æ²¹'], enName: 'TG', enAliases: ['Triglyceride'], description: 'è¡€è„‚æŒ‡æ ‡', unit: 'mmol/L', normalRange: '<1.7' },
  { id: '19', cnName: 'æ€»èƒ†å›ºé†‡', cnAliases: ['èƒ†å›ºé†‡'], enName: 'TC', enAliases: ['Total Cholesterol'], description: 'è¡€è„‚æŒ‡æ ‡', unit: 'mmol/L', normalRange: '<5.2' },
  { id: '20', cnName: 'é«˜å¯†åº¦è„‚è›‹ç™½èƒ†å›ºé†‡', cnAliases: ['é«˜å¯†åº¦è„‚è›‹ç™½', 'å¥½èƒ†å›ºé†‡'], enName: 'HDL-C', enAliases: ['HDL'], description: 'ä¿æŠ¤æ€§èƒ†å›ºé†‡', unit: 'mmol/L', normalRange: '>1.0' },
  { id: '21', cnName: 'ä½Žå¯†åº¦è„‚è›‹ç™½èƒ†å›ºé†‡', cnAliases: ['ä½Žå¯†åº¦è„‚è›‹ç™½', 'åèƒ†å›ºé†‡'], enName: 'LDL-C', enAliases: ['LDL'], description: 'è‡´åŠ¨è„‰ç¡¬åŒ–èƒ†å›ºé†‡', unit: 'mmol/L', normalRange: '<3.4' },
  { id: '22', cnName: 'é’¾', cnAliases: ['è¡€æ¸…é’¾'], enName: 'K', enAliases: ['Potassium'], description: 'ç”µè§£è´¨ï¼Œå½±å“å¿ƒè„åŠŸèƒ½', unit: 'mmol/L', normalRange: '3.5-5.5' },
  { id: '23', cnName: 'é’ ', cnAliases: ['è¡€æ¸…é’ '], enName: 'Na', enAliases: ['Sodium'], description: 'ç”µè§£è´¨ï¼Œç»´æŒæ¸—é€åŽ‹', unit: 'mmol/L', normalRange: '135-145' },
  { id: '24', cnName: 'æ°¯', cnAliases: ['è¡€æ¸…æ°¯'], enName: 'Cl', enAliases: ['Chloride'], description: 'ç”µè§£è´¨', unit: 'mmol/L', normalRange: '96-108' },
  { id: '25', cnName: 'é’™', cnAliases: ['è¡€æ¸…é’™'], enName: 'Ca', enAliases: ['Calcium'], description: 'éª¨éª¼å¥åº·æŒ‡æ ‡', unit: 'mmol/L', normalRange: '2.1-2.7' },
  { id: '26', cnName: 'ç³–åŒ–è¡€çº¢è›‹ç™½', cnAliases: ['ç³–åŒ–è¡€çº¢è›‹ç™½A1c'], enName: 'HbA1c', enAliases: ['Glycated Hemoglobin', 'A1C'], description: 'åæ˜ è¿‘3ä¸ªæœˆè¡€ç³–æŽ§åˆ¶', unit: '%', normalRange: '<6.5' },
  { id: '27', cnName: 'ä¿ƒç”²çŠ¶è…ºæ¿€ç´ ', cnAliases: ['ä¿ƒç”²çŠ¶è…ºç´ '], enName: 'TSH', enAliases: ['Thyroid Stimulating Hormone'], description: 'ç”²çŠ¶è…ºåŠŸèƒ½ç­›æŸ¥', unit: 'mIU/L', normalRange: '0.27-4.2' },
  { id: '28', cnName: 'æ¸¸ç¦»ç”²çŠ¶è…ºç´ ', cnAliases: ['æ¸¸ç¦»T4'], enName: 'FT4', enAliases: ['Free T4'], description: 'ç”²çŠ¶è…ºåŠŸèƒ½æŒ‡æ ‡', unit: 'pmol/L', normalRange: '12-22' },
  { id: '29', cnName: 'æ¸¸ç¦»ä¸‰ç¢˜ç”²çŠ¶è…ºåŽŸæ°¨é…¸', cnAliases: ['æ¸¸ç¦»T3'], enName: 'FT3', enAliases: ['Free T3'], description: 'ç”²çŠ¶è…ºåŠŸèƒ½æŒ‡æ ‡', unit: 'pmol/L', normalRange: '3.1-6.8' },
  { id: '30', cnName: 'Cååº”è›‹ç™½', cnAliases: ['è¶…æ•Cååº”è›‹ç™½'], enName: 'CRP', enAliases: ['C-Reactive Protein', 'hs-CRP'], description: 'ç‚Žç—‡æŒ‡æ ‡', unit: 'mg/L', normalRange: '<10' }
];

// å›¾è¡¨é¢œè‰²
const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

// å¥åº·æŒ‡æ ‡ç±»åž‹å®šä¹‰
const VITAL_TYPES = [
  { id: 'blood_pressure', name: 'è¡€åŽ‹', icon: 'Heart', unit: 'mmHg', hasTwo: true, label1: 'æ”¶ç¼©åŽ‹', label2: 'èˆ’å¼ åŽ‹', normalRange: '90-140 / 60-90', color: '#ef4444' },
  { id: 'heart_rate', name: 'å¿ƒçŽ‡', icon: 'Activity', unit: 'bpm', hasTwo: false, normalRange: '60-100', color: '#f97316' },
  { id: 'weight', name: 'ä½“é‡', icon: 'Scale', unit: 'kg', hasTwo: false, normalRange: '-', color: '#8b5cf6' },
  { id: 'blood_sugar', name: 'è¡€ç³–', icon: 'Droplet', unit: 'mmol/L', hasTwo: false, normalRange: '3.9-6.1(ç©ºè…¹)', color: '#10b981' },
  { id: 'temperature', name: 'ä½“æ¸©', icon: 'Thermometer', unit: 'Â°C', hasTwo: false, normalRange: '36.1-37.2', color: '#06b6d4' },
  { id: 'oxygen', name: 'è¡€æ°§', icon: 'Wind', unit: '%', hasTwo: false, normalRange: '95-100', color: '#3b82f6' }
];

// AI API é…ç½®
const API_PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', placeholder: 'AIzaSy...' },
  { id: 'openai', name: 'OpenAI GPT-4o', placeholder: 'sk-...' },
  { id: 'claude', name: 'Claude API', placeholder: 'sk-ant-...' },
  { id: 'qwen', name: 'é˜¿é‡Œé€šä¹‰åƒé—®', placeholder: 'sk-...', defaultKey: 'sk-43aaa7b36c9d4303bc916e184a523790' },
  { id: 'siliconflow', name: 'ç¡…åŸºæµåŠ¨', placeholder: 'sk-...' }
];

// LeanCloud é…ç½®
const LC_CONFIG = {
  appId: 'CRfeDG3VSyidc5qcX3SVtibn-gzGzoHsz',
  appKey: 'mqv2BXZT7u9GhAwVe7mAO9PL',
  serverURL: 'https://crfedg3v.lc-cn-n1-shared.com'
};

// é»˜è®¤æ¼”ç¤ºæ•°æ®
const DEFAULT_MEDS = [];
const DEFAULT_CATALOG = [];
const DEFAULT_CHECKUPS = [];
const DEFAULT_LAB_REPORTS = [];
const DEFAULT_IMAGING_REPORTS = [];
const DEFAULT_VITALS = [];

// åŒ»å­¦æœ¯è¯­è¯æ±‡è¡¨
const MEDICAL_GLOSSARY = {
  'ç™½ç»†èƒž': 'å…ç–«ç³»ç»Ÿçš„é‡è¦ç»„æˆéƒ¨åˆ†,å‡é«˜é€šå¸¸æç¤ºæ„ŸæŸ“æˆ–ç‚Žç—‡,é™ä½Žå¯èƒ½æç¤ºå…ç–«åŠ›ä½Žä¸‹ã€‚',
  'çº¢ç»†èƒž': 'è´Ÿè´£è¿è¾“æ°§æ°”ã€‚åä½Žå¯èƒ½æç¤ºè´«è¡€,åé«˜å¯èƒ½è§äºŽç¼ºæ°§ã€‚',
  'è¡€çº¢è›‹ç™½': 'çº¢ç»†èƒžå†…è¿è¾“æ°§æ°”çš„è›‹ç™½è´¨,æ˜¯åˆ¤æ–­è´«è¡€åŠå…¶ç¨‹åº¦çš„ä¸»è¦æŒ‡æ ‡ã€‚',
  'è¡€ç³–': 'è¡€æ¶²ä¸­çš„è‘¡è„ç³–å«é‡ã€‚ç©ºè…¹è¡€ç³–å‡é«˜æ˜¯è¯Šæ–­ç³–å°¿ç—…çš„é‡è¦ä¾æ®ã€‚',
  'è‚Œé…': 'è‚Œè‚‰ä»£è°¢äº§ç‰©,æ˜¯åæ˜ è‚¾åŠŸèƒ½çš„é‡è¦æŒ‡æ ‡ã€‚'
};
