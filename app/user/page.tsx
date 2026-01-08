"use client";
import DefinedStatus from '@/components/DefinedStatus';
import EvaluateeCard from '@/components/EvaluateeCard'
import React, { useState } from 'react'

const page = () => {
	return (
	<>
		<div className='px-20 py-7.5'>
			<div className='flex items-center mb-3'>
				<p className='text-title font-medium text-myApp-blueDark'>ผู้รับการประเมิน (4)</p>
				<div className='ml-auto flex'>
					<DefinedStatus/>
				</div>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				<EvaluateeCard
					name="นางสาวรักงาน สู้ชีวิต"
					title="Software Engineer Level 3"
				/>
				<EvaluateeCard
					name="นางสาวรักงาน สู้ชีวิต"
					title="Software Engineer Level 3"
					stripColor="yellow"
				/>
				<EvaluateeCard
					name="นางสาวรักงาน สู้ชีวิต"
					title="Software Engineer Level 3"
					stripColor="yellow"
				/>
				<EvaluateeCard
					name="นางสาวรักงาน สู้ชีวิต"
					title="Software Engineer Level 3"
					stripColor="green"
				/>
			</div>
		</div>
	</>
  )
}

export default page
