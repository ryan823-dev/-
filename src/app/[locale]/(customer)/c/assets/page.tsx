"use client";

import { redirect } from 'next/navigation';

// 重定向到运营视图的素材中心（临时方案，后续可独立实现客户版）
export default function CustomerAssetsPage() {
  // 目前复用运营视图的素材中心
  redirect('/zh-CN/assets');
}
