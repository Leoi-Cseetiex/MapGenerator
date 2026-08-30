/* ============================================================
   ROAD NETWORK: SEGMENTS, SNAPPING, INTERSECTIONS
   ============================================================ */

'use strict';

function nearestRoad(
  s,
  x,
  y,
  radius=20,
  type=0
){

  let best = null;

  let bd =
    1e9;

  for(
    let yy=y-radius;
    yy<=y+radius;
    yy++
  ){

    for(
      let xx=x-radius;
      xx<=x+radius;
      xx++
    ){

      if(
        !inside(xx,yy)
      ){
        continue;
      }

      const rt =
        s.road[
          ci(xx,yy)
        ];

      if(
        !rt ||
        (
          type &&
          rt !== type
        )
      ){
        continue;
      }

      const d =
        Math.hypot(
          xx-x,
          yy-y
        );

      if(d < bd){

        bd = d;

        best = {
          x:xx,
          y:yy,
          d
        };

      }

    }

  }

  return best;

}


/* ============================================================
   SEGMENT GRAPH
   ============================================================ */

function buildSegments(points){

  const out = [];

  for(
    let i=1;
    i<points.length;
    i++
  ){

    const a =
      points[i-1];

    const b =
      points[i];

    if(
      Math.hypot(
        b.x-a.x,
        b.y-a.y
      ) > .1
    ){

      out.push({

        a:{
          x:a.x,
          y:a.y
        },

        b:{
          x:b.x,
          y:b.y
        }

      });

    }

  }

  return out;

}


const SEG_BUCKET = 16;


function segmentBucketKeys(
  seg,
  pad=4
){

  const minX =
    Math.floor(
      (
        Math.min(
          seg.a.x,
          seg.b.x
        ) -
        pad
      ) /
      SEG_BUCKET
    );

  const maxX =
    Math.floor(
      (
        Math.max(
          seg.a.x,
          seg.b.x
        ) +
        pad
      ) /
      SEG_BUCKET
    );

  const minY =
    Math.floor(
      (
        Math.min(
          seg.a.y,
          seg.b.y
        ) -
        pad
      ) /
      SEG_BUCKET
    );

  const maxY =
    Math.floor(
      (
        Math.max(
          seg.a.y,
          seg.b.y
        ) +
        pad
      ) /
      SEG_BUCKET
    );

  const keys = [];

  for(
    let by=minY;
    by<=maxY;
    by++
  ){

    for(
      let bx=minX;
      bx<=maxX;
      bx++
    ){

      keys.push(
        bx + ',' + by
      );

    }

  }

  return keys;

}


function indexSegment(
  s,
  seg
){

  for(
    const key of
    segmentBucketKeys(seg)
  ){

    let arr =
      s.segBuckets.get(key);

    if(!arr){

      s.segBuckets.set(
        key,
        arr=[]
      );

    }

    arr.push(seg);

  }

}


function querySegments(
  s,
  seg,
  pad=6
){

  const found =
    new Set();

  const out = [];

  for(
    const key of
    segmentBucketKeys(
      seg,
      pad
    )
  ){

    const arr =
      s.segBuckets.get(key);

    if(!arr){
      continue;
    }

    for(
      const q of arr
    ){

      if(
        !found.has(q)
      ){

        found.add(q);

        out.push(q);

      }

    }

  }

  return out;

}


function nearestProjection(
  p,
  a,
  b
){

  const vx =
    b.x-a.x;

  const vy =
    b.y-a.y;

  const l2 =
    vx*vx +
    vy*vy;

  if(!l2){

    return {

      x:a.x,
      y:a.y,

      d:Math.hypot(
        p.x-a.x,
        p.y-a.y
      )

    };

  }

  const t =
    clamp(
      (
        (p.x-a.x)*vx +
        (p.y-a.y)*vy
      ) /
      l2,
      0,
      1
    );

  const x =
    a.x +
    t*vx;

  const y =
    a.y +
    t*vy;

  return {

    x,
    y,

    d:Math.hypot(
      p.x-x,
      p.y-y
    )

  };

}


function snapEndpointToRoad(
  s,
  p
){

  let best = null;

  const probe = {

    a:{
      x:p.x-3,
      y:p.y-3
    },

    b:{
      x:p.x+3,
      y:p.y+3
    }

  };

  for(
    const seg of
    querySegments(
      s,
      probe,
      4
    )
  ){

    const q =
      nearestProjection(
        p,
        seg.a,
        seg.b
      );

    if(
      q.d <= 3 &&
      (
        !best ||
        q.d < best.d
      )
    ){

      best = {
        ...q,
        seg
      };

    }

  }

  return best;

}


function findOrCreateNode(
  s,
  x,
  y,
  roadIds=[]
){

  let node =
    s.intersections.find(
      n =>
        Math.hypot(
          n.x-x,
          n.y-y
        ) <= 2
    );

  if(!node){

    node = {

      id:
        s.nextNodeId++,

      x,
      y,

      z:1,

      connectedRoadIds:[],

      approaches:[],

      classification:
        'UNCLASSIFIED',

      radius:10

    };

    s.intersections.push(node);

  }

  for(
    const id of roadIds
  ){

    if(
      !node.connectedRoadIds.includes(id)
    ){

      node.connectedRoadIds.push(id);

    }

  }

  return node;

}


/* ============================================================
   ROAD CANDIDATE
   ============================================================ */

function candidateRoad(
  s,
  points,
  type,
  widthPx,
  allowSnap=true
){

  const id =
    s.nextRoadId++;

  const pts =
    points.map(
      p => ({
        x:p.x,
        y:p.y
      })
    );


  if(allowSnap){

    for(
      const endIndex of
      [0,pts.length-1]
    ){

      const snap =
        snapEndpointToRoad(
          s,
          pts[endIndex]
        );

      if(
        snap &&
        snap.d > .15
      ){

        pts[endIndex] = {
          x:snap.x,
          y:snap.y
        };

        s.snapCount++;

      }

    }

  }


  const candidateSegs =
    buildSegments(pts);

  const crossings = [];


  for(
    const cs of
    candidateSegs
  ){

    for(
      const es of
      querySegments(
        s,
        cs,
        8
      )
    ){

      const ang =
        angleDifference(
          heading(
            cs.a,
            cs.b
          ),
          heading(
            es.a,
            es.b
          )
        );

      const hit =
        segmentIntersection(
          cs.a,
          cs.b,
          es.a,
          es.b
        );


      if(hit){

        crossings.push({
          hit,
          existing:es
        });

        continue;

      }


      const halfA =
        widthPx /
        (SUB*2);

      const halfB =
        es.widthPx /
        (SUB*2);

      const dist =
        segDistance(
          cs.a,
          cs.b,
          es.a,
          es.b
        );

      const threshold =
        halfA +
        halfB +
        .45;


      if(
        dist < threshold &&
        ang < deg(15)
      ){

        s.rejectedCount++;

        return null;

      }


      if(
        dist < threshold &&
        ang >= deg(15) &&
        ang < deg(35)
      ){

        s.rejectedCount++;

        return null;

      }

    }

  }


  const road = {

    id,

    z:1,

    type,

    roadClass:
      ROAD_CLASS[type] || 2,

    widthPx,

    laneCount:
      type === ARTERIAL
        ? (
          widthPx >= 28
            ? 4
            : 2
        )
        : type === LOCAL
          ? 2
          : 1,

    points:pts,

    cells:[],

    bbox:{

      minX:
        Math.min(
          ...pts.map(
            p=>p.x
          )
        ),

      maxX:
        Math.max(
          ...pts.map(
            p=>p.x
          )
        ),

      minY:
        Math.min(
          ...pts.map(
            p=>p.y
          )
        ),

      maxY:
        Math.max(
          ...pts.map(
            p=>p.y
          )
        )

    }

  };


  for(
    const seg of
    candidateSegs
  ){

    seg.roadId = id;

    seg.type = type;

    seg.widthPx =
      widthPx;

    seg.roadClass =
      road.roadClass;


    s.segments.push(seg);

    indexSegment(
      s,
      seg
    );


    for(
      const q of
      bres(
        seg.a.x,
        seg.a.y,
        seg.b.x,
        seg.b.y
      )
    ){

      if(
        !road.cells.length ||
        road.cells[
          road.cells.length-1
        ].x !== q.x ||
        road.cells[
          road.cells.length-1
        ].y !== q.y
      ){

        road.cells.push(q);

      }

    }

  }


  const foot =
    Math.max(
      .35,
      widthPx /
      (SUB*2)
    );


  const clear =
    foot +
    (
      type === ARTERIAL
        ? 1.5
        : 1
    );


  for(
    const q of
    road.cells
  ){

    reserveDisk(
      s.reserve,
      q.x,
      q.y,
      clear,
      RES_ROAD_CLEAR
    );

    reserveDisk(
      s.reserve,
      q.x,
      q.y,
      foot,
      RES_ROAD
    );


    for(
      let y=Math.floor(q.y-foot);
      y<=Math.ceil(q.y+foot);
      y++
    ){

      for(
        let x=Math.floor(q.x-foot);
        x<=Math.ceil(q.x+foot);
        x++
      ){

        if(
          inside(x,y) &&
          Math.hypot(
            x-q.x,
            y-q.y
          ) <= foot
        ){

          s.road[
            ci(x,y)
          ] =
            Math.max(
              s.road[
                ci(x,y)
              ],
              type
            );

        }

      }

    }

  }


  s.roads.push(road);


  for(
    const c of crossings
  ){

    findOrCreateNode(
      s,
      c.hit.x,
      c.hit.y,
      [
        id,
        c.existing.roadId
      ]
    );

  }


  return road;

}


/* ============================================================
   INTERSECTION CLASSIFICATION
   ============================================================ */

function circularGaps(a){

  const x =
    [...a].sort(
      (m,n)=>m-n
    );

  const g = [];

  for(
    let i=0;
    i<x.length;
    i++
  ){

    const n =
      (i+1)%x.length;

    let d =
      (
        n
          ? x[n]
          : x[0]+Math.PI*2
      ) -
      x[i];

    g.push(d);

  }

  return g;

}


function uniqueAngles(arr){

  const out = [];

  for(
    const a of arr
  ){

    let keep = true;

    for(
      const b of out
    ){

      let d =
        Math.abs(a-b);

      d =
        Math.min(
          d,
          Math.PI*2-d
        );

      if(
        d < deg(12)
      ){

        keep = false;

        break;

      }

    }

    if(keep){
      out.push(a);
    }

  }

  return out;

}


function classifyNode(
  s,
  node
){

  const approaches = [];


  const probe = {

    a:{
      x:node.x-3,
      y:node.y-3
    },

    b:{
      x:node.x+3,
      y:node.y+3
    }

  };


  for(
    const seg of
    querySegments(
      s,
      probe,
      4
    )
  ){

    const road =
      s.roads.find(
        r=>r.id===seg.roadId
      );

    if(!road){
      continue;
    }


    const d =
      pointSegDist(
        node,
        seg.a,
        seg.b
      );


    if(d > 2.5){
      continue;
    }


    const da =
      Math.hypot(
        node.x-seg.a.x,
        node.y-seg.a.y
      );

    const db =
      Math.hypot(
        node.x-seg.b.x,
        node.y-seg.b.y
      );


    const far =
      da > db
        ? seg.a
        : seg.b;


    approaches.push({

      roadId:
        seg.roadId,

      heading:
        Math.atan2(
          far.y-node.y,
          far.x-node.x
        ),

      roadClass:
        road.roadClass,

      widthPx:
        road.widthPx,

      laneCount:
        road.laneCount

    });


    if(
      !node.connectedRoadIds.includes(
        seg.roadId
      )
    ){

      node.connectedRoadIds.push(
        seg.roadId
      );

    }

  }


  node.approaches = [];


  for(
    const a of approaches
  ){

    if(
      !node.approaches.some(
        b =>
          b.roadId === a.roadId &&
          angleDifference(
            a.heading,
            b.heading
          ) < deg(12)
      )
    ){

      node.approaches.push(a);

    }

  }


  const angles =
    uniqueAngles(
      node.approaches.map(
        a =>
          (
            a.heading +
            Math.PI*2
          ) %
          (Math.PI*2)
      )
    );


  const n =
    angles.length;


  if(n <= 2){

    node.classification =
      'MERGE/BEND';

  }
  else if(n === 3){

    const gaps =
      circularGaps(angles);

    const largest =
      Math.max(...gaps);

    const smallest =
      Math.min(...gaps);

    node.classification =
      largest > deg(150)
        ? 'T'
        : smallest > deg(70)
          ? 'Y'
          : 'SKEW_T';

  }
  else if(n === 4){

    const gaps =
      circularGaps(angles);

    const ortho =
      gaps.every(
        g =>
          Math.abs(
            g-Math.PI/2
          ) < deg(22)
      );

    node.classification =
      ortho
        ? 'FOUR_WAY'
        : 'SKEW_FOUR_WAY';

  }
  else{

    node.classification =
      n >= 5
        ? 'COMPLEX'
        : 'MULTI_ARM';

  }


  const roads =
    node.connectedRoadIds
      .map(
        id =>
          s.roads.find(
            r=>r.id===id
          )
      )
      .filter(Boolean);


  const maxWidth =
    roads.length
      ? Math.max(
        ...roads.map(
          r=>r.widthPx
        )
      )
      : 12;


  const totalLanes =
    roads.reduce(
      (
        sum,
        r
      ) =>
        sum +
        r.laneCount,
      0
    );


  node.radius =
    maxWidth * .65 +
    Math.min(
      12,
      totalLanes * .75
    );


  reserveDisk(
    s.reserve,
    node.x,
    node.y,
    node.radius/SUB,
    RES_INTERSECTION
  );

}


function finalizeNodes(s){

  const merged = [];


  for(
    const n of
    s.intersections
  ){

    let m =
      merged.find(
        q =>
          Math.hypot(
            q.x-n.x,
            q.y-n.y
          ) < 2
      );


    if(!m){

      merged.push(n);

    }
    else{

      m.x =
        (m.x+n.x)/2;

      m.y =
        (m.y+n.y)/2;


      for(
        const id of
        n.connectedRoadIds
      ){

        if(
          !m.connectedRoadIds.includes(
            id
          )
        ){

          m.connectedRoadIds.push(
            id
          );

        }

      }

    }

  }


  s.intersections =
    merged;


  s.intersections.forEach(
    n =>
      classifyNode(
        s,
        n
      )
  );

}


/* ============================================================
   PARK GENERATION
   ============================================================ */

