import { el, NodeRepr_t } from '@elemaudio/core'
import WebAudioRenderer from '@elemaudio/web-renderer'
import {CanvasSpace, Pt, Group, Line, World, Body, Polygon, Particle} from 'pts'
import {createScale, transpose, noteToFrequency, SCALE, INTERVAL} from 'ts-music-fns'
import { ScientificNote } from 'ts-music-fns/dist/types'

const core = new WebAudioRenderer()
const ctx = new AudioContext()


const baseNotes = createScale('F#2', SCALE.MELODIC_MINOR)
const leadNotes = createScale('F#3', SCALE.MELODIC_MINOR)//.map(note => transpose(note, INTERVAL.MINOR_SEVENTH))
// const arabicScaleNotesMinorThird = arabicScaleNotes.map<ScientificNote>((note) => transpose(note, INTERVAL.OCTAVE))
// const arabicScaleNotesMinorSixth = arabicScaleNotes.map<ScientificNote>((note) => transpose(note, INTERVAL.MINOR_SEVENTH))

const baseFreqs = [...baseNotes].map(note => noteToFrequency(note))
const leadFreqs = [...leadNotes].map(note => noteToFrequency(note))

function quantize(x: number | NodeRepr_t) {
  return el.div(el.floor(el.mul(x, 4)), 4);
}

function startAudio() {
  const gate1 = el.max(el.train(3.2), el.train(2))
  const r1 = el.latch(gate1, el.phasor(1, el.train(1)))
  const t = el.table({data: baseFreqs}, quantize(r1))
  const base = el.mul(el.bleptriangle(t), el.adsr(0.01, 0.2, 0.6, 1, gate1))
  
  const gate2 = el.max(el.train(3.3), el.train(2))
  const r2 = el.latch(gate2, el.phasor(1, el.train(1)))
  const t2 = el.table({data: leadFreqs}, quantize(r2))
  const lead = el.mul(el.cycle(t2), el.adsr(0.01, 0.2, 0.3, 0.3, gate2))

  const audio = el.mul(0.5 , el.add(el.mul(base, 0.3), lead))
  core.render(audio, audio)
}

async function setupAudio () {
  await ctx.resume()
  document.removeEventListener('click', setupAudio)

  const node = await core.initialize(ctx, {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2],
  });

  node.connect(ctx.destination);

  startAudio()
}
document.addEventListener('click', setupAudio)

const space = new CanvasSpace('#pts').setup({ bgcolor: '#09F', resize: true, retina: true });
const world = new World( space.innerBound, 0.99, new Pt(0, 500) );
const form = space.getForm();

space.add( {

  start: () => {
    let unit = (space.size.x+space.size.y) / 150;
    
    // Create bodies and particles
    let hexagon = Body.fromGroup( Polygon.fromCenter( space.center.add(100, -100), unit*10, 6 ), 0.5 );
    let square = Body.fromGroup( Polygon.fromCenter( space.center.subtract(100,50), unit*8, 4 ), 1 );
    let triangle = Body.fromGroup( Polygon.fromCenter( space.center, unit*6, 3 ) );
    let p1 = new Particle( new Pt( space.center.x, 100 ) ).size( unit*4 );
    let p2 = new Particle( new Pt( space.center.x, 100 ) ).size( unit*2 );

    // add to world
    world.add( hexagon ).add( square ).add( triangle, "triangle" );
    world.add( p1 ).add( p2 );

    // hit them with impulse
    p1.hit( 200, -20 );
    p2.hit( 100, -50 );
    (hexagon[0] as Particle).hit( 120, -40 );
    (square[0] as Particle).hit( -300, -20 );

    // lock triangle's first vertice so we can control it by pointer
    (triangle[0] as Particle).lock = true;
  },


  animate: (time, ftime) => {
    world.drawParticles( (p, i) => form.fillOnly("#09f").point( p, p.radius, "circle" ) );

    world.drawBodies( (b, i) => { 
      form.fillOnly(["#0c9","#f03","#fe6"][i%3]).polygon( b ); 
      form.strokeOnly("rgba(0,0,0,0.1");
      b.linksToLines().forEach( (l) => form.line(l) ); // visualize the edge constraints
    });
    
    world.update( ftime );
  },


  action:( type, px, py) => {
    world.body("triangle")[0].position = new Pt(px, py);
  },

  resize: (bound, evt) => {
    if (world) world.bound = space.innerBound;
  }
  
});

space.bindMouse().bindTouch();
space.play();