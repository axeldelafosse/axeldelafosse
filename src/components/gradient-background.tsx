import { Velustro } from 'uvcanvas'

function GradientBackground() {
  return (
    <div className="fixed h-dvh w-screen blur-[1px] transform-gpu">
      <Velustro />
    </div>
  )
}

export default GradientBackground
