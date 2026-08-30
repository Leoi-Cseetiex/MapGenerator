/* ============================================================
   MAIN GENERATION PASS
   ============================================================ */

'use strict';

function generate(){

  const seed =
    Math.floor(
      Math.random() *
      4294967295
    ) >>> 0;


  const r =
    rng32(seed);


  const s = {

    seed,

    rng:r,

    core:{

      x:
        97 +
        Math.floor(
          r()*7
        ),

      y:
        97 +
        Math.floor(
          r()*7
        )

    },

    zone:
      new Uint8Array(
        P*P
      ),

    road:
      new Uint8Array(
        C*C
      ),

    park:
      new Uint8Array(
        C*C
      ),

    build:
      new Uint8Array(
        C*C
      ),

    reserve:
      new Uint16Array(
        C*C
      ),

    roads:[],

    segments:[],

    segBuckets:
      new Map(),

    intersections:[],

    rails:[],

    stations:[],

    parks:[],

    buildings:[],

    trees:[],

    benches:[],

    playgrounds:[],

    pavilions:[],

    facilities:[],

    lights:[],

    bins:[],

    buses:[],

    entrances:[],

    nextRoadId:1,

    nextNodeId:1,

    rejectedCount:0,

    snapCount:0

  };


  /* ----------------------------------------------------------
     HUBS
     ---------------------------------------------------------- */

  const hubs = [];


  for(
    let i=0;
    i<5;
    i++
  ){

    const a =
      i/5 *
      Math.PI*2 +
      (r()*2-1)*.18;


    const rad =
      42 +
      r()*26;


    hubs.push({

      x:
        clamp(
          Math.round(
            s.core.x +
            Math.cos(a)*rad
          ),
          16,
          183
        ),

      y:
        clamp(
          Math.round(
            s.core.y +
            Math.sin(a)*rad
          ),
          16,
          183
        )

    });

  }


  s.hubs = hubs;


  /* ----------------------------------------------------------
     ARTERIAL RINGS
     ---------------------------------------------------------- */

  for(
    let ring=0;
    ring<2;
    ring++
  ){

    const rad =
      30 +
      ring*35;


    const pts = [];


    for(
      let i=0;
      i<=32;
      i++
    ){

      const a =
        i/32 *
        Math.PI*2;


      const w =
        Math.sin(
          a*(2+ring)
        )*4 +
        (r()*2-1)*2;


      pts.push({

        x:
          s.core.x +
          Math.cos(a) *
          (rad+w),

        y:
          s.core.y +
          Math.sin(a) *
          (
            rad*.82 +
            w
          )

      });

    }


    candidateRoad(
      s,
      pts,
      ARTERIAL,
      ring
        ? 30
        : 28,
      false
    );

  }


  /* ----------------------------------------------------------
     RADIAL ARTERIALS
     ---------------------------------------------------------- */

  for(
    let i=0;
    i<9;
    i++
  ){

    const a =
      i/9 *
      Math.PI*2 +
      (r()*2-1)*.14;


    candidateRoad(
      s,
      jitter(
        s.core,
        edge(a),
        r,
        5,
        13
      ),
      ARTERIAL,
      30,
      false
    );

  }


  /* ----------------------------------------------------------
     HUB CONNECTORS
     ---------------------------------------------------------- */

  hubs.forEach(
    h =>
      candidateRoad(
        s,
        jitter(
          h,
          s.core,
          r,
          3,
          6
        ),
        ARTERIAL,
        26,
        true
      )
  );


  /* ----------------------------------------------------------
     LOCAL ROADS
     ---------------------------------------------------------- */

  for(
    let i=0;
    i<150 &&
    s.roads.filter(
      q=>q.type===LOCAL
    ).length < 105;
    i++
  ){

    const tx =
      8 +
      Math.floor(
        r()*184
      );

    const ty =
      8 +
      Math.floor(
        r()*184
      );


    const start =
      nearestRoad(
        s,
        tx,
        ty,
        24
      );


    if(!start){
      continue;
    }


    let x =
      start.x;

    let y =
      start.y;


    let h =
      r() < .5;


    let sign =
      r() < .5
        ? -1
        : 1;


    const pts = [{
      x:start.x,
      y:start.y
    }];


    for(
      let n=0;
      n<
      1 +
      Math.floor(
        r()*3
      );
      n++
    ){

      const len =
        7 +
        Math.floor(
          r()*18
        );


      if(h){

        x =
          clamp(
            x +
            sign*len,
            3,
            196
          );

      }
      else{

        y =
          clamp(
            y +
            sign*len,
            3,
            196
          );

      }


      pts.push({
        x,
        y
      });


      h = !h;


      sign =
        r() < .5
          ? -1
          : 1;

    }


    candidateRoad(
      s,
      pts,
      LOCAL,
      r() < .35
        ? 14
        : 12,
      true
    );

  }


  /* ----------------------------------------------------------
     ALLEYS
     ---------------------------------------------------------- */

  for(
    let i=0;
    i<130 &&
    s.roads.filter(
      q=>q.type===ALLEY
    ).length < 75;
    i++
  ){

    const start =
      nearestRoad(
        s,
        8 +
        Math.floor(
          r()*184
        ),
        8 +
        Math.floor(
          r()*184
        ),
        10
      );


    if(!start){
      continue;
    }


    candidateRoad(
      s,
      [
        {
          x:start.x,
          y:start.y
        },
        {
          x:
            clamp(
              start.x +
              Math.round(
                (r()*2-1)*10
              ),
              2,
              197
            ),
          y:
            clamp(
              start.y +
              Math.round(
                (r()*2-1)*10
              ),
              2,
              197
            )
        }
      ],
      ALLEY,
      5,
      true
    );

  }


  finalizeNodes(s);


  /* ----------------------------------------------------------
     ZONING
     ---------------------------------------------------------- */

  for(
    let py=0;
    py<P;
    py++
  ){

    for(
      let px=0;
      px<P;
      px++
    ){

      const x =
        px*2+1;

      const y =
        py*2+1;


      let score =
        1.15 *
        Math.exp(
          -Math.hypot(
            x-s.core.x,
            y-s.core.y
          ) /
          48
        );


      for(
        const h of hubs
      ){

        score =
          Math.max(
            score,
            .92 *
            Math.exp(
              -Math.hypot(
                x-h.x,
                y-h.y
              ) /
              30
            )
          );

      }


      score +=
        (r()*2-1)*.07;


      s.zone[
        pi(px,py)
      ] =
        score > .57
          ? 2
          : score > .18
            ? 1
            : 0;

    }

  }


  /* ----------------------------------------------------------
     PARKS
     ---------------------------------------------------------- */

  generateParks(s);

  placeParkAssets(s);


  /* ----------------------------------------------------------
     BUILDINGS
     ---------------------------------------------------------- */

  const BUILD_FORBIDDEN =
    RES_ROAD |
    RES_ROAD_CLEAR |
    RES_INTERSECTION |
    RES_WATER |
    RES_PATH |
    RES_BUILD |
    RES_BUILD_CLEAR |
    RES_ASSET;


  for(
    let attempt=0;
    attempt<1400;
    attempt++
  ){

    const px =
      Math.floor(
        r()*P
      );

    const py =
      Math.floor(
        r()*P
      );


    const zone =
      s.zone[
        pi(px,py)
      ];


    if(!zone){
      continue;
    }


    const w =
      zone === 2
        ? 2 +
          Math.floor(
            r()*5
          )
        : 2 +
          Math.floor(
            r()*3
          );


    const h =
      zone === 2
        ? 2 +
          Math.floor(
            r()*6
          )
        : 2 +
          Math.floor(
            r()*4
          );


    const x =
      clamp(
        px*2 +
        Math.floor(
          r()*2
        ),
        1,
        C-w-1
      );


    const y =
      clamp(
        py*2 +
        Math.floor(
          r()*2
        ),
        1,
        C-h-1
      );


    if(
      !canRect(
        s.reserve,
        x,
        y,
        w,
        h,
        BUILD_FORBIDDEN,
        1
      )
    ){
      continue;
    }


    let parkOverlap =
      false;


    for(
      let yy=y;
      yy<y+h;
      yy++
    ){

      for(
        let xx=x;
        xx<x+w;
        xx++
      ){

        if(
          s.park[
            ci(xx,yy)
          ]
        ){

          parkOverlap =
            true;

        }

      }

    }


    if(parkOverlap){
      continue;
    }


    const type =
      zone === 2
        ? (
          r() < .18
            ? 3
            : 2
        )
        : 1;


    for(
      let yy=y;
      yy<y+h;
      yy++
    ){

      for(
        let xx=x;
        xx<x+w;
        xx++
      ){

        s.build[
          ci(xx,yy)
        ] =
          type;


        s.reserve[
          ci(xx,yy)
        ] |=
          RES_BUILD;

      }

    }


    reserveRect(
      s.reserve,
      x,
      y,
      w,
      h,
      RES_BUILD_CLEAR,
      1
    );


    s.buildings.push({

      x,
      y,
      w,
      h,
      type

    });

  }


  /* ----------------------------------------------------------
     SUBWAY
     ---------------------------------------------------------- */

  const interchange = {

    x:
      Math.round(
        s.core.x
      ),

    y:
      Math.round(
        s.core.y
      )

  };


  for(
    let i=0;
    i<5;
    i++
  ){

    const h =
      hubs[i];


    const a =
      Math.atan2(
        h.y-s.core.y,
        h.x-s.core.x
      );


    s.rails.push([

      ...jitter(
        edge(
          a+Math.PI
        ),
        interchange,
        r,
        3,
        5
      ).slice(
        0,
        -1
      ),

      ...jitter(
        interchange,
        h,
        r,
        2,
        3
      ).slice(
        0,
        -1
      ),

      ...jitter(
        h,
        edge(a),
        r,
        3,
        5
      )

    ]);

  }


  s.rails.push([
    ...hubs,
    hubs[0]
  ]);


  s.stations.push(
    interchange,
    ...hubs
  );


  s.stations.forEach(
    st =>
      reserveDisk(
        s.reserve,
        st.x,
        st.y,
        2,
        RES_STATION
      )
  );


  /* ----------------------------------------------------------
     BUS STOPS
     ---------------------------------------------------------- */

  const busForbidden =
    RES_BUILD |
    RES_BUILD_CLEAR |
    RES_WATER |
    RES_TREE |
    RES_ASSET |
    RES_BUS |
    RES_INTERSECTION;


  const arterialCells = [];


  for(
    let y=2;
    y<C-2;
    y++
  ){

    for(
      let x=2;
      x<C-2;
      x++
    ){

      if(
        s.road[
          ci(x,y)
        ] === ARTERIAL
      ){

        arterialCells.push({
          x,
          y
        });

      }

    }

  }


  for(
    let tries=0;
    tries<1800 &&
    s.buses.length<24;
    tries++
  ){

    const q =
      arterialCells[
        Math.floor(
          r()*arterialCells.length
        )
      ];


    if(!q){
      break;
    }


    const offsets = [
      [3,0],
      [-3,0],
      [0,3],
      [0,-3]
    ];


    const o =
      offsets[
        Math.floor(
          r()*offsets.length
        )
      ];


    const x =
      q.x +
      o[0];

    const y =
      q.y +
      o[1];


    if(
      !inside(x,y) ||
      s.reserve[
        ci(x,y)
      ] &
      busForbidden
    ){
      continue;
    }


    if(
      s.buses.some(
        b =>
          Math.hypot(
            b.x-x,
            b.y-y
          ) < 14
      )
    ){
      continue;
    }


    s.reserve[
      ci(x,y)
    ] |=
      RES_BUS;


    s.buses.push({
      x,
      y
    });

  }


  /* ----------------------------------------------------------
     SUBWAY ENTRANCES
     ---------------------------------------------------------- */

  const entForbidden =
    RES_ROAD |
    RES_BUILD |
    RES_BUILD_CLEAR |
    RES_WATER |
    RES_TREE |
    RES_ASSET |
    RES_ENTRANCE |
    RES_INTERSECTION;


  for(
    const st of
    s.stations
  ){

    let placed = 0;


    const candidates = [];


    for(
      let rr=2;
      rr<=6;
      rr++
    ){

      for(
        let dy=-rr;
        dy<=rr;
        dy++
      ){

        for(
          let dx=-rr;
          dx<=rr;
          dx++
        ){

          if(
            Math.abs(dx) === rr ||
            Math.abs(dy) === rr
          ){

            candidates.push({

              x:
                Math.round(
                  st.x+dx
                ),

              y:
                Math.round(
                  st.y+dy
                )

            });

          }

        }

      }

    }


    candidates.sort(
      (a,b) =>
        Math.hypot(
          a.x-st.x,
          a.y-st.y
        ) -
        Math.hypot(
          b.x-st.x,
          b.y-st.y
        )
    );


    for(
      const q of
      candidates
    ){

      if(
        placed >= 2
      ){
        break;
      }


      if(
        !inside(
          q.x,
          q.y
        )
      ){
        continue;
      }


      const k =
        ci(
          q.x,
          q.y
        );


      if(
        s.reserve[k] &
        entForbidden
      ){
        continue;
      }


      s.reserve[k] |=
        RES_ENTRANCE;


      s.entrances.push({

        x:q.x,
        y:q.y,
        station:st

      });


      placed++;

    }

  }


  state = s;


  selected = {

    x:
      interchange.x *
      SUB +
      4,

    y:
      interchange.y *
      SUB +
      4

  };


  updateStats();

  render();

}


/* ============================================================
   DETAIL VIEW BOUNDS
   ============================================================ */

