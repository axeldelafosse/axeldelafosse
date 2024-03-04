import { Velustro } from 'uvcanvas'

function GradientBackground() {
  return (
    <div className="fixed h-screen w-screen blur-[1px] transform-gpu">
      <Velustro />
    </div>
  )
}

export default GradientBackground
