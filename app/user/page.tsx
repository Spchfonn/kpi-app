"use client";
import DefinedStatus from '@/components/DefinedStatus';
import EvaluateeCard from '@/components/EvaluateeCard'
import React, { useState } from 'react'

export default function ProfilePage({ params }: { params: { id: string } })  {
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
					id="01"
					name="นางสาวรักงาน สู้ชีวิต"
					title="Software Engineer Level 3"
				/>
				<EvaluateeCard
					id="02"
					name="นางสาวรักงาน สู้ชีวิต"
					title="Software Engineer Level 3"
					stripColor="yellow"
				/>
				<EvaluateeCard
					id="03"
					name="นางสาวรักงาน สู้ชีวิต"
					title="Software Engineer Level 3"
					stripColor="yellow"
				/>
				<EvaluateeCard
					id="04"
					name="นางสาวรักงาน สู้ชีวิต"
					title="Software Engineer Level 3"
					stripColor="green"
				/>
			</div>
		</div>
	</>
  )
}
