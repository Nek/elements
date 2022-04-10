import planck, {
  testbed,
  Box,
  Circle,
  Edge,
  Polygon,
  RevoluteJoint,
  Vec2,
  WheelJoint,
  World,
} from "planck/dist/planck-with-testbed"

console.log(testbed)
// This is a fun demo that shows off the wheel joint
testbed(function (testbed) {
  console.log(testbed)
  testbed.speed = 1.3
  testbed.hz = 50

  const world = new World({
    gravity: Vec2(0, -9.8),
  })

  const ground = world.createBody()

  const groundFD = {
    density: 0.0,
    friction: 0.6,
  }

  ground.createFixture(Edge(Vec2(-100.0, 0.0), Vec2(100.0, 0.0)), groundFD)

  const ball = world.createBody({
    type: "dynamic",
    position: Vec2(0, 30),
  })

  const box = world.createBody({
    type: "dynamic",
    position: Vec2(1, 33),
  })

  ball.createFixture(Circle(1))
  box.createFixture(Box(1, 1, Vec2(0, 0), 0))

  box.setFixedRotation(false)

  return world
})
