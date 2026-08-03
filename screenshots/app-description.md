# Food Diary (음식 일기) - App Description

## Overview
개인 음식 일기 앱. 내가 먹은 음식 사진 + 별점(1-5) + 한 줄 메모 + 위치를 기록하는 앱.

## Core Purpose
나중에 사진을 둘러보며 "이거 뭐였지? 어디였지? 또 먹고 싶다" 회상하는 **개인 기록**이 핵심 목적.
식당 평가 앱이 아닌, **음식 단위의 개인 평가/기록** 앱.

## Design Philosophy: 극도의 간편함
- **필수 입력**: 사진 + 별점(1-5)만. 이 두 개면 바로 올릴 수 있음
- **선택 입력**: 코멘트, 음식 이름(menu_name), 식당 이름, 태그 등 전부 선택
- **UI 원칙**: 음식 이름을 필수 라벨처럼 띄우지 않음. 없을 수 있으므로
- **위치 표시**: 식당 이름이 있으면 식당 이름, 없으면 도로명 주소 표시

## Key Features
1. **홈 피드** - 내 음식 사진 앨범/일기장 (소셜 피드가 아님). 4:3 비율 카드에 glass-morphism 오버레이
2. **기록하기** - 카메라로 사진 촬영 → 별점 매기기 → 선택적 메모/태그/위치 추가
3. **포스트 상세** - 히어로 이미지 + 아래서 올라오는 info card (식당, 메모, 위치, 날짜)
4. **평점 시트** - 이모지 + 슬라이더 + 퀵셀렉트로 1-5점 평가. 5점이면 컨페티, 1점이면 비 효과
5. **지도 화면** - 내 포스트 + 팔로잉 포스트만 표시. 음식 사진 마커 + 별점 배지
6. **프로필** - 아바타 + 기록 수 + 평균 평점 + 포토 그리드
7. **부가 기능** - 좋아요, 댓글, 팔로우, 알림, 검색, 설정 (전부 보조적)

## Tech Stack
- React Native (Expo SDK 55) + TypeScript
- Expo Router v4 (file-based routing)
- Supabase (PostgreSQL + PostGIS, Auth, Storage)
- Zustand (client state) + @tanstack/react-query (server state)

## Design System
- **Theme**: Dark only
- **Colors**: #161514 (bg), #211F1E (card), #FF6B6B (coral accent)
- **Rating Colors**: #FF6B6B (1-star red), #FF9800 (2-star orange), #FFD700 (3-star yellow), #A8E06C (4-star lime), #4CAF50 (5-star green)
- **Font**: Pretendard (Korean), Inter (fallback)
- **Border Radius**: 36px (cards), 26px (nav pill), pill (buttons)
- **Glass-morphism**: backdrop blur + semi-transparent bg (#1A1A1ACC) + thin white border (#FFFFFF12)
- **Floating Nav**: centered pill shape, 4 tabs (home/map/camera/profile), active tab = coral fill

## Screens
디자인 레퍼런스는 별도 이미지 파일 참조.
