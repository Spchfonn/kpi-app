"use client";
import DefinedStatus from '@/components/DefinedStatus';
import EvaluateeCardForEvaluateKpi from '@/components/EvaluateeCardForEvaluateKpi';
import React, { useState } from 'react'

export default function Page({ params }: { params: { id: string } })  {
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
                <EvaluateeCardForEvaluateKpi
                    id="01"
                    name="นางสาวรักงาน สู้ชีวิต"
                    title="Software Engineer Level 3"
                />
                <EvaluateeCardForEvaluateKpi
                    id="02"
                    name="นางสาวรักงาน สู้ชีวิต"
                    title="Software Engineer Level 3"
                    stripColor="yellow"
                />
                <EvaluateeCardForEvaluateKpi
                    id="03"
                    name="นางสาวรักงาน สู้ชีวิต"
                    title="Software Engineer Level 3"
                    stripColor="yellow"
                />
                <EvaluateeCardForEvaluateKpi
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
