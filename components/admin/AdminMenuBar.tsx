import React from 'react'
import Link from 'next/link'

const AdminMenuBar = () => {
	return (
		<div className="flex gap-4 bg-myApp-cream">
			<button className="px-3 py-1 text-body font-medium rounded-4xl
												 border-2 border-myApp-blueDark text-myApp-blueDark
												 hover:bg-myApp-blueDark hover:text-myApp-cream transition-colors">
				รอบการประเมิน
			</button>

			<button className="px-3 py-1 text-body font-medium rounded-4xl
												 border-2 border-myApp-blueDark text-myApp-blueDark
												 hover:bg-myApp-blueDark hover:text-myApp-cream transition-colors">
				โครงสร้างองค์กร
			</button>

			<button className="px-3 py-1 text-body font-medium rounded-4xl
												 border-2 border-myApp-blueDark text-myApp-blueDark
												 hover:bg-myApp-blueDark hover:text-myApp-cream transition-colors">
				Dashboard
			</button>
		</div>
	)
}

export default AdminMenuBar
