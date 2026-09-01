/* ============================================================
   RENDER PRIMITIVES: BOUNDS, PROJECTION, SHAPE DRAWING
   ============================================================ */

'use strict';

function bounds(){

  const span =
    parentSpan *
    MINOR_PER_PARENT;


  const parentX =
    Math.floor(
      selected.x /
      MINOR_PER_PARENT
    );


  const parentY =
    Math.floor(
      selected.y /
      MINOR_PER_PARENT
    );


  const psx =
    clamp(
      parentX -
      Math.floor(
        parentSpan/2
      ),
      0,
      P-parentSpan
    );


  const psy =
    clamp(
      parentY -
      Math.floor(
        parentSpan/2
      ),
      0,
      P-parentSpan
    );


  const sx =
    psx *
    MINOR_PER_PARENT;


  const sy =
    psy *
    MINOR_PER_PARENT;


  return {

    span,

    sx,
    sy,

    scale:
      V/span,

    cx0:
      Math.max(
        0,
        Math.floor(
          sx/SUB
        ) -
        2
      ),

    cy0:
      Math.max(
        0,
        Math.floor(
          sy/SUB
        ) -
        2
      ),

    cx1:
      Math.min(
        C,
        Math.ceil(
          (sx+span)/SUB
        ) +
        2
      ),

    cy1:
      Math.min(
        C,
        Math.ceil(
          (sy+span)/SUB
        ) +
        2
      )

  };

}


/* ============================================================
   WORLD TO VIEW
   ============================================================ */

function worldPoint(
  p,
  b
){

  return {

    x:
      (
        p.x*SUB +
        4 -
        b.sx
      ) *
      b.scale,

    y:
      (
        p.y*SUB +
        4 -
        b.sy
      ) *
      b.scale

  };

}


/* ============================================================
   ROAD VISIBILITY
   ============================================================ */

function routeVisible(
  road,
  b
){

  if(
    !road.bbox
  ){
    return true;
  }


  const minX =
    b.sx/SUB -
    6;

  const maxX =
    (
      b.sx +
      b.span
    ) /
    SUB +
    6;


  const minY =
    b.sy/SUB -
    6;

  const maxY =
    (
      b.sy +
      b.span
    ) /
    SUB +
    6;


  return !(
    road.bbox.maxX <
    minX ||
    road.bbox.minX >
    maxX ||
    road.bbox.maxY <
    minY ||
    road.bbox.minY >
    maxY
  );

}


/* ============================================================
   CELL-STEPPED ROUTE GEOMETRY

   Roads/rails are authored as a handful of free-angle control
   points, but are drawn as a path that only ever steps into the
   micro-grid cell directly above/below/left/right (straight or
   90°) or the diagonally touching corner cell (45°) — an 8-way
   Bresenham walk between each pair of control points, at 4×4
   micro-grid resolution. Runs of collinear steps are collapsed
   back down to their end corners so long straight stretches stay
   cheap to stroke. Results are memoized per points-array, since
   the control points never change after generation.
   ============================================================ */

const MICRO_UNIT =
  SUB * MICRO_PER_MINOR;

const steppedRouteCache =
  new WeakMap();


function simplifyStepped(pts){

  if(pts.length <= 2){
    return pts;
  }

  const out = [
    pts[0]
  ];

  for(
    let i=1;
    i<pts.length-1;
    i++
  ){

    const a =
      pts[i-1];

    const b =
      pts[i];

    const c =
      pts[i+1];

    const d1x =
      Math.sign(b.x-a.x);

    const d1y =
      Math.sign(b.y-a.y);

    const d2x =
      Math.sign(c.x-b.x);

    const d2y =
      Math.sign(c.y-b.y);

    if(
      d1x !== d2x ||
      d1y !== d2y
    ){
      out.push(b);
    }

  }

  out.push(
    pts[pts.length-1]
  );

  return out;

}


function steppedRoutePoints(points){

  const cached =
    steppedRouteCache.get(points);

  if(cached){
    return cached;
  }


  const micro =
    points.map(
      p => ({
        x:Math.round(p.x*MICRO_UNIT),
        y:Math.round(p.y*MICRO_UNIT)
      })
    );

  const raw = [];

  for(
    let i=1;
    i<micro.length;
    i++
  ){

    const seg =
      bresPoints(
        micro[i-1].x,
        micro[i-1].y,
        micro[i].x,
        micro[i].y
      );

    for(
      let j =
        raw.length
          ? 1
          : 0;
      j<seg.length;
      j++
    ){
      raw.push(seg[j]);
    }

  }

  if(!raw.length && micro.length){
    raw.push(micro[0]);
  }


  const result =
    simplifyStepped(raw).map(
      p => ({
        x:p.x/MICRO_UNIT,
        y:p.y/MICRO_UNIT
      })
    );

  steppedRouteCache.set(
    points,
    result
  );

  return result;

}


/* ============================================================
   ROUTE DRAWING
   ============================================================ */

function strokeRoute(
  ctx,
  road,
  b,
  width,
  color,
  dash=[],
  offset=0
){

  if(
    !routeVisible(
      road,
      b
    )
  ){
    return;
  }


  const pts =
    steppedRoutePoints(
      road.points
    );

  if(pts.length < 2){
    return;
  }


  ctx.strokeStyle =
    color;


  ctx.lineWidth =
    Math.max(
      .5,
      width *
      b.scale
    );


  ctx.lineCap =
    'round';

  ctx.lineJoin =
    'round';


  ctx.setLineDash(
    dash.map(
      v =>
        v*b.scale
    )
  );


  ctx.beginPath();


  for(
    let i=0;
    i<pts.length;
    i++
  ){

    const p =
      worldPoint(
        pts[i],
        b
      );


    let nx = 0;
    let ny = 0;


    if(offset){

      const prev =
        pts[
          Math.max(0,i-1)
        ];

      const next =
        pts[
          Math.min(
            pts.length-1,
            i+1
          )
        ];

      const pw =
        worldPoint(prev,b);

      const nw =
        worldPoint(next,b);

      const dx =
        nw.x-pw.x;

      const dy =
        nw.y-pw.y;

      const L =
        Math.max(
          1,
          Math.hypot(dx,dy)
        );

      nx = -dy/L;
      ny = dx/L;

    }


    const x =
      p.x +
      nx*offset*b.scale;

    const y =
      p.y +
      ny*offset*b.scale;


    if(i === 0){
      ctx.moveTo(x,y);
    }
    else{
      ctx.lineTo(x,y);
    }

  }


  ctx.stroke();


  ctx.setLineDash([]);

}


/* ============================================================
   INTERSECTION DRAWING
   ============================================================ */

function drawIntersection(
  ctx,
  n,
  b,
  solid,
  color
){

  const p =
    worldPoint(
      n,
      b
    );


  const rad =
    n.radius *
    b.scale;


  ctx.fillStyle =
    solid
      ? color
      : palette.road;


  ctx.beginPath();

  ctx.arc(
    p.x,
    p.y,
    rad,
    0,
    Math.PI*2
  );

  ctx.fill();


  if(solid){
    return;
  }


  const approaches =
    n.approaches;


  for(
    const a of
    approaches
  ){

    const dx =
      Math.cos(
        a.heading
      );

    const dy =
      Math.sin(
        a.heading
      );


    const nx =
      -dy;

    const ny =
      dx;


    const road =
      state.roads.find(
        r =>
          r.id ===
          a.roadId
      );


    if(!road){
      continue;
    }


    const half =
      road.widthPx /
      2 *
      b.scale;


    const walk =
      rad +
      4*b.scale;


    const cx =
      p.x +
      dx*walk;

    const cy =
      p.y +
      dy*walk;


    if(
      road.roadClass >= 4
    ){

      ctx.strokeStyle =
        palette.white;


      ctx.lineWidth =
        Math.max(
          1,
          b.scale
        );


      for(
        let s=-4;
        s<=4;
        s+=2
      ){

        ctx.beginPath();


        ctx.moveTo(

          cx +
          dx*s*b.scale -
          nx*half,

          cy +
          dy*s*b.scale -
          ny*half

        );


        ctx.lineTo(

          cx +
          dx*s*b.scale +
          nx*half,

          cy +
          dy*s*b.scale +
          ny*half

        );


        ctx.stroke();

      }


      const stopDist =
        rad +
        12*b.scale;


      const sx =
        p.x +
        dx*stopDist;

      const sy =
        p.y +
        dy*stopDist;


      ctx.beginPath();


      ctx.moveTo(
        sx,
        sy
      );


      ctx.lineTo(

        sx +
        nx*half,

        sy +
        ny*half

      );


      ctx.stroke();

    }

  }


  if(
    document
      .getElementById(
        'intersectionLabels'
      )
      .checked &&
    b.scale > 2
  ){

    ctx.fillStyle =
      palette.junction;


    ctx.beginPath();


    ctx.arc(
      p.x,
      p.y,
      2.2*b.scale,
      0,
      Math.PI*2
    );


    ctx.fill();


    ctx.fillStyle =
      '#2d1712';


    ctx.font =
      `${
        Math.max(
          9,
          8*b.scale
        )
      }px system-ui`;


    ctx.textAlign =
      'center';


    ctx.textBaseline =
      'bottom';


    ctx.fillText(

      n.classification
        .split('_')
        .join(' '),

      p.x,

      p.y -
      rad -
      3

    );

  }

}


/* ============================================================
   DETAIL OBJECTS
   ============================================================ */

function detailRect(
  ctx,
  x,
  y,
  w,
  h,
  fill,
  stroke
){

  ctx.fillStyle =
    fill;


  ctx.fillRect(
    x,
    y,
    w,
    h
  );


  if(stroke){

    ctx.strokeStyle =
      stroke;


    ctx.strokeRect(
      x+.5,
      y+.5,
      Math.max(
        0,
        w-1
      ),
      Math.max(
        0,
        h-1
      )
    );

  }

}


/* ============================================================
   BUILDING DETAIL
   ============================================================ */

function drawBuildingDetailed(
  ctx,
  q,
  b,
  solid,
  color
){

  const x =
    (
      q.x*SUB -
      b.sx
    ) *
    b.scale;


  const y =
    (
      q.y*SUB -
      b.sy
    ) *
    b.scale;


  const w =
    q.w *
    SUB *
    b.scale;


  const h =
    q.h *
    SUB *
    b.scale;


  const base =
    solid
      ? color
      : q.type === 1
        ? palette.house
        : q.type === 2
          ? palette.building
          : palette.tower;


  ctx.fillStyle =
    base;


  ctx.fillRect(
    x,
    y,
    w,
    h
  );


  if(solid){
    return;
  }


  ctx.strokeStyle =
    palette.wall;


  ctx.lineWidth =
    Math.max(
      1,
      b.scale*.55
    );


  ctx.strokeRect(
    x+.5,
    y+.5,
    w-1,
    h-1
  );


  const inset =
    Math.max(
      2,
      2*b.scale
    );


  ctx.fillStyle =
    q.type === 1
      ? palette.roof
      : palette.roofDark;


  ctx.fillRect(

    x+inset,
    y+inset,

    Math.max(
      1,
      w-inset*2
    ),

    Math.max(
      1,
      h-inset*2
    )

  );


  if(
    q.type === 1
  ){

    ctx.strokeStyle =
      palette.wall;


    ctx.beginPath();


    ctx.moveTo(
      x+inset,
      y+h*.5
    );


    ctx.lineTo(
      x+w*.5,
      y+inset
    );


    ctx.lineTo(
      x+w-inset,
      y+h*.5
    );


    ctx.stroke();

  }
  else if(
    b.scale > 1.35
  ){

    const cols =
      Math.max(
        1,
        Math.min(
          5,
          Math.floor(
            q.w/2
          )
        )
      );


    const rows =
      Math.max(
        1,
        Math.min(
          6,
          Math.floor(
            q.h/2
          )
        )
      );


    ctx.fillStyle =
      q.type === 3
        ? palette.window
        : palette.windowDark;


    for(
      let yy=0;
      yy<rows;
      yy++
    ){

      for(
        let xx=0;
        xx<cols;
        xx++
      ){

        if(
          (
            xx+yy
          ) %
          2 &&
          q.type === 2
        ){
          continue;
        }


        const wx =
          x +
          w *
          (xx+1) /
          (cols+1);


        const wy =
          y +
          h *
          (yy+1) /
          (rows+1);


        const ww =
          Math.max(
            1,
            1.2*b.scale
          );


        const wh =
          Math.max(
            1,
            1*b.scale
          );


        ctx.fillRect(
          wx-ww/2,
          wy-wh/2,
          ww,
          wh
        );

      }

    }


    if(
      q.type === 3
    ){

      ctx.fillStyle =
        palette.metal;


      ctx.fillRect(

        x+w*.4,

        y+h*.08,

        w*.2,

        Math.max(
          1,
          b.scale
        )

      );

    }

  }


  ctx.fillStyle =
    palette.wall;


  ctx.fillRect(

    x+w*.43,

    y+h-
    Math.max(
      2,
      2*b.scale
    ),

    w*.14,

    Math.max(
      2,
      2*b.scale
    )

  );

}


/* ============================================================
   TREE DETAIL
   ============================================================ */

function drawTreeDetailed(
  ctx,
  q,
  b,
  solid,
  color
){

  const p =
    worldPoint(
      q,
      b
    );


  if(solid){

    ctx.fillStyle =
      color;


    ctx.beginPath();


    ctx.arc(
      p.x,
      p.y,
      3.4*b.scale,
      0,
      Math.PI*2
    );


    ctx.fill();

    return;

  }


  ctx.fillStyle =
    palette.trunk;


  ctx.fillRect(

    p.x -
    .65*b.scale,

    p.y,

    1.3*b.scale,

    2.5*b.scale

  );


  ctx.fillStyle =
    palette.tree;


  ctx.beginPath();


  ctx.arc(

    p.x,

    p.y -
    1.2*b.scale,

    3.3*b.scale,

    0,
    Math.PI*2

  );


  ctx.fill();


  ctx.fillStyle =
    palette.tree2;


  ctx.beginPath();


  ctx.arc(

    p.x +
    1.1*b.scale,

    p.y -
    2*b.scale,

    1.8*b.scale,

    0,
    Math.PI*2

  );


  ctx.fill();

}


/* ============================================================
   BUS STOP DETAIL
   ============================================================ */

function drawBusStop(
  ctx,
  q,
  b,
  solid,
  color
){

  const p =
    worldPoint(
      q,
      b
    );


  const s =
    b.scale;


  if(solid){

    ctx.fillStyle =
      color;


    ctx.fillRect(
      p.x-2*s,
      p.y-3*s,
      4*s,
      6*s
    );

    return;

  }


  ctx.strokeStyle =
    palette.metal;


  ctx.lineWidth =
    Math.max(
      1,
      .8*s
    );


  ctx.strokeRect(
    p.x-2.5*s,
    p.y-2*s,
    4.5*s,
    4*s
  );


  ctx.beginPath();


  ctx.moveTo(
    p.x-2.5*s,
    p.y-2*s
  );


  ctx.lineTo(
    p.x+1.2*s,
    p.y-4*s
  );


  ctx.lineTo(
    p.x+2*s,
    p.y-2*s
  );


  ctx.stroke();


  ctx.fillStyle =
    palette.bus;


  ctx.fillRect(
    p.x+2.4*s,
    p.y-3.8*s,
    1.2*s,
    5.4*s
  );


  ctx.fillStyle =
    palette.white;


  ctx.fillRect(
    p.x+2.55*s,
    p.y-3.35*s,
    .9*s,
    .9*s
  );

}


/* ============================================================
   SUBWAY ENTRANCE DETAIL
   ============================================================ */

function drawEntranceDetailed(
  ctx,
  q,
  b,
  solid,
  color
){

  const p =
    worldPoint(
      q,
      b
    );


  const s =
    b.scale;


  if(solid){

    ctx.fillStyle =
      color;


    ctx.fillRect(
      p.x-3*s,
      p.y-3*s,
      6*s,
      6*s
    );

    return;

  }


  ctx.fillStyle =
    palette.entrance;


  ctx.fillRect(
    p.x-3*s,
    p.y-3*s,
    6*s,
    6*s
  );


  ctx.strokeStyle =
    palette.wall;


  ctx.strokeRect(
    p.x-3*s,
    p.y-3*s,
    6*s,
    6*s
  );


  ctx.strokeStyle =
    palette.metal;


  for(
    let i=-2;
    i<=2;
    i++
  ){

    ctx.beginPath();


    ctx.moveTo(
      p.x-2.2*s,
      p.y+i*.8*s
    );


    ctx.lineTo(
      p.x+2.2*s,
      p.y+i*.8*s
    );


    ctx.stroke();

  }


  ctx.fillStyle =
    palette.white;


  ctx.fillRect(
    p.x-2.4*s,
    p.y-4.2*s,
    4.8*s,
    .8*s
  );

}


/* ============================================================
   LAYER RENDERER
   ============================================================ */

