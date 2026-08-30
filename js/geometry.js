/* ============================================================
   GEOMETRY HELPERS
   ============================================================ */

'use strict';

function bres(x0,y0,x1,y1){

  x0 = Math.round(x0);
  y0 = Math.round(y0);

  x1 = Math.round(x1);
  y1 = Math.round(y1);

  const out = [];

  let dx =
    Math.abs(x1-x0);

  let sx =
    x0 < x1
      ? 1
      : -1;

  let dy =
    -Math.abs(y1-y0);

  let sy =
    y0 < y1
      ? 1
      : -1;

  let e =
    dx + dy;

  while(true){

    if(inside(x0,y0)){

      out.push({
        x:x0,
        y:y0
      });

    }

    if(
      x0 === x1 &&
      y0 === y1
    ){
      break;
    }

    const e2 =
      2 * e;

    if(e2 >= dy){

      e += dy;
      x0 += sx;

    }

    if(e2 <= dx){

      e += dx;
      y0 += sy;

    }

  }

  return out;

}


/* ============================================================
   WORLD EDGE
   ============================================================ */

function edge(a){

  const cx = 100;
  const cy = 100;

  const dx = Math.cos(a);
  const dy = Math.sin(a);

  const tx =
    dx > 0
      ? (197-cx)/dx
      : dx < 0
        ? (2-cx)/dx
        : Infinity;

  const ty =
    dy > 0
      ? (197-cy)/dy
      : dy < 0
        ? (2-cy)/dy
        : Infinity;

  const t =
    Math.min(
      Math.abs(tx),
      Math.abs(ty)
    );

  return {

    x:Math.round(
      cx + dx*t
    ),

    y:Math.round(
      cy + dy*t
    )

  };

}


/* ============================================================
   ROUTE JITTER
   ============================================================ */

function jitter(a,b,r,n=4,amp=8){

  const pts = [a];

  const vx =
    b.x - a.x;

  const vy =
    b.y - a.y;

  const L =
    Math.max(
      1,
      Math.hypot(vx,vy)
    );

  const nx =
    -vy / L;

  const ny =
    vx / L;

  for(
    let i=1;
    i<=n;
    i++
  ){

    const t =
      i / (n+1);

    const j =
      (r()*2-1) *
      amp *
      Math.sin(Math.PI*t);

    pts.push({

      x:clamp(
        a.x +
        vx*t +
        nx*j,
        2,
        197
      ),

      y:clamp(
        a.y +
        vy*t +
        ny*j,
        2,
        197
      )

    });

  }

  pts.push(b);

  return pts;

}


/* ============================================================
   RESERVATIONS
   ============================================================ */

function reserveDisk(
  mask,
  cx,
  cy,
  r,
  bit
){

  for(
    let y=Math.floor(cy-r);
    y<=Math.ceil(cy+r);
    y++
  ){

    for(
      let x=Math.floor(cx-r);
      x<=Math.ceil(cx+r);
      x++
    ){

      if(
        inside(x,y) &&
        Math.hypot(
          x-cx,
          y-cy
        ) <= r
      ){

        mask[ci(x,y)] |= bit;

      }

    }

  }

}


function reserveRect(
  mask,
  x,
  y,
  w,
  h,
  bit,
  m=0
){

  for(
    let yy=y-m;
    yy<y+h+m;
    yy++
  ){

    for(
      let xx=x-m;
      xx<x+w+m;
      xx++
    ){

      if(inside(xx,yy)){

        mask[
          ci(xx,yy)
        ] |= bit;

      }

    }

  }

}


function canRect(
  mask,
  x,
  y,
  w,
  h,
  forbidden,
  m=0
){

  for(
    let yy=y-m;
    yy<y+h+m;
    yy++
  ){

    for(
      let xx=x-m;
      xx<x+w+m;
      xx++
    ){

      if(
        !inside(xx,yy) ||
        mask[ci(xx,yy)] &
        forbidden
      ){

        return false;

      }

    }

  }

  return true;

}


/* ============================================================
   GEOMETRY
   ============================================================ */

function heading(a,b){

  return Math.atan2(
    b.y-a.y,
    b.x-a.x
  );

}


function angleDifference(a,b){

  let d =
    Math.abs(a-b);

  while(d > Math.PI){

    d =
      Math.abs(
        d -
        Math.PI*2
      );

  }

  return Math.min(
    d,
    Math.PI-d
  );

}


function segmentIntersection(
  a,b,c,d
){

  const r = {
    x:b.x-a.x,
    y:b.y-a.y
  };

  const s = {
    x:d.x-c.x,
    y:d.y-c.y
  };

  const cross = (u,v) =>
    u.x*v.y -
    u.y*v.x;

  const rxs =
    cross(r,s);

  const qp = {
    x:c.x-a.x,
    y:c.y-a.y
  };

  if(
    Math.abs(rxs) <
    1e-6
  ){
    return null;
  }

  const t =
    cross(qp,s) /
    rxs;

  const u =
    cross(qp,r) /
    rxs;

  if(
    t > 0.02 &&
    t < 0.98 &&
    u > 0.02 &&
    u < 0.98
  ){

    return {

      x:
        a.x +
        t*r.x,

      y:
        a.y +
        t*r.y,

      t,
      u

    };

  }

  return null;

}


function pointSegDist(
  p,a,b
){

  const vx =
    b.x-a.x;

  const vy =
    b.y-a.y;

  const l2 =
    vx*vx +
    vy*vy;

  if(l2 === 0){

    return Math.hypot(
      p.x-a.x,
      p.y-a.y
    );

  }

  let t =
    (
      (p.x-a.x)*vx +
      (p.y-a.y)*vy
    ) / l2;

  t =
    clamp(
      t,
      0,
      1
    );

  return Math.hypot(

    p.x -
    (
      a.x +
      t*vx
    ),

    p.y -
    (
      a.y +
      t*vy
    )

  );

}


function segDistance(
  a,b,c,d
){

  if(
    segmentIntersection(
      a,b,c,d
    )
  ){
    return 0;
  }

  return Math.min(

    pointSegDist(
      a,c,d
    ),

    pointSegDist(
      b,c,d
    ),

    pointSegDist(
      c,a,b
    ),

    pointSegDist(
      d,a,b
    )

  );

}


/* ============================================================
   ROAD LOOKUP
   ============================================================ */

