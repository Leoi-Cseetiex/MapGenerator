/* ============================================================
   WORLD CONSTANTS, PALETTE, CANVASES, SHARED STATE
   ============================================================ */

'use strict';

/* ============================================================
   WORLD SCALE
   ============================================================ */

const P = 100;
const C = 200;
const SUB = 8;
const R = 1600;
const V = 800;


/*
  LOWER-SCALE HIERARCHY

  One topology parent:
      16 × 16 minor squares

  One minor square:
      4 × 4 micro squares

  Therefore:

      1 parent
      = 16 × 16 minor
      = 64 × 64 micro

  Complete world:

      1600 × 1600 minor
      6400 × 6400 micro
*/

const MINOR_PER_PARENT = 16;
const MICRO_PER_MINOR = 4;
const MICRO_R = R * MICRO_PER_MINOR;


/* ============================================================
   ROAD TYPES
   ============================================================ */

const LOCAL = 1;
const ARTERIAL = 2;
const ALLEY = 3;

const ROAD_CLASS = {
  1:2,
  2:4,
  3:1
};


/* ============================================================
   TERRAIN
   ============================================================ */

const GRASS = 1;
const PATH = 2;
const WATER = 3;
const PLAZA = 4;


/* ============================================================
   RESERVATION MASKS
   ============================================================ */

const RES_ROAD         = 1 << 0;
const RES_ROAD_CLEAR   = 1 << 1;
const RES_WATER        = 1 << 2;
const RES_PATH         = 1 << 3;
const RES_BUILD        = 1 << 4;
const RES_BUILD_CLEAR  = 1 << 5;
const RES_TREE         = 1 << 6;
const RES_STATION      = 1 << 7;
const RES_ASSET        = 1 << 8;
const RES_BUS          = 1 << 9;
const RES_ENTRANCE     = 1 << 10;
const RES_INTERSECTION = 1 << 11;


/* ============================================================
   Z SYSTEM
   ============================================================ */

const ZS = [-2,-1,0,1,2];

const ZINFO = {

  '-2':[
    'Rail tracks',
    'Track bed, sleepers and dual steel rails',
    '#605768'
  ],

  '-1':[
    'Platforms',
    'Subway platforms and station areas',
    '#85798c'
  ],

  '0':[
    'Terrain / parks',
    'Grass, paths, ponds, plazas and park ground',
    '#708b5c'
  ],

  '1':[
    'Roads',
    'Continuous road geometry with classified junctions',
    '#656b6e'
  ],

  '2':[
    'Buildings / assets',
    'Buildings, trees, park assets and transport assets',
    '#75687a'
  ]

};


/* ============================================================
   COLOURS
   ============================================================ */

const palette = {

  bg:'#eeeae1',

  city:'#85778c',
  urban:'#7e9285',

  accent:'#2c71d0',

  grass:'#8eae6c',
  grass2:'#40663f',
  grass3:'#72945a',

  path:'#c8b991',
  pathEdge:'#8f8062',

  plaza:'#b8ad91',
  plazaJoint:'#93866c',

  water:'#6da4b7',
  waterEdge:'#467786',
  waterHi:'#9bc8d5',

  sidewalk:'#b8b4ab',
  curb:'#696660',

  road:'#4f5457',
  local:'#686d6f',
  alley:'#938d83',

  white:'#f7f7f3',

  house:'#9a7d63',
  building:'#777a82',
  tower:'#56616b',

  wall:'#3e3b38',

  roof:'#b4a18d',
  roofDark:'#4d555d',

  window:'#d8e4e7',
  windowDark:'#657078',

  tree:'#416b42',
  tree2:'#315333',
  trunk:'#6b4d36',

  bench:'#765842',
  metal:'#555b5e',

  play:'#bd8765',
  play2:'#d9b163',

  pavilion:'#816b59',
  facility:'#85796e',

  bus:'#c18b43',
  entrance:'#b7a7bb',

  light:'#e4d78f',
  bin:'#4f6460',

  railBed:'#403944',
  rail:'#d2c9d2',
  sleeper:'#766c79',

  platform:'#8e8491',
  platformEdge:'#d6cbd9',

  junction:'#cc704f',

  reserveRoad:'#d5aa54',
  reserveBuild:'#946bb2',
  reserveAsset:'#5a8bad'

};


/* ============================================================
   CANVASES
   ============================================================ */

const overview =
  document.getElementById('overview');

const detail =
  document.getElementById('detail');

const oc =
  overview.getContext('2d');

const dc =
  detail.getContext('2d');


const temp =
  document.createElement('canvas');

temp.width = V;
temp.height = V;

const tc =
  temp.getContext('2d');


const marks =
  document.createElement('canvas');

marks.width = V;
marks.height = V;

const mc =
  marks.getContext('2d');


const pixelate =
  document.createElement('canvas');

pixelate.width = 1;
pixelate.height = 1;

const pxc =
  pixelate.getContext('2d');


const ci = (x,y) =>
  y * C + x;

const pi = (x,y) =>
  y * P + x;

const inside = (x,y) =>
  x >= 0 &&
  y >= 0 &&
  x < C &&
  y < C;

const clamp = (v,a,b) =>
  Math.max(a,Math.min(b,v));

const deg = d =>
  d * Math.PI / 180;


let state = null;

let currentZ = 1;

let composite = false;

let parentSpan = 6;

let selected = {
  x:800,
  y:800
};

