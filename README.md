**사이드 프로젝트를 쉽게 운영할 수 있게 도와주는 서비스, Blay**

---

# MySQL Docker 사용 방법
## 준비 사항
* Docker 설치

## 사용 방법
### Docker 설정
처음 사용자는 docker 환경을 설정해야 합니다.
1. docker-entrypoint.sh를 실행 파일로 변경합니다.
```
chmod +x docker-entrypoint.sh
```
2. docker image를 build 합니다. 여기서 image 태그(이름)는 blay_mysql로 하겠습니다.
```
docker build -t blay_mysql .
```
3. image가 제대로 build 됐는지 확인합니다. REPOSITORY 항목에 설정한 태그 이름이 있으면 됩니다.
```
docker image ls
```
4. container를 생성한 후 실행합니다. 여기서 container 이름(--name 뒤)은 blay_mysql로 하겠습니다. 비밀번호(MYSQL_ROOT_PASSWORD)는 원하는 것으로 하면 됩니다. -d 뒤에 image 태그(이름)를 작성하면 됩니다.
```
docker run -p 3306:3306 --name blay_mysql -e MYSQL_ROOT_PASSWORD='YOUR_PASSWORD' -d blay_mysql --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
```
5. container가 제대로 실행됐는지 확인합니다. 컨테이너의 NAMES 항목이 설정한 이름이고 STATUS 항목에 UP으로 표시되면 됩니다.
```
docker container ls
```
6. mysql_init.sql을 생성한 container에 적용합니다.
```
docker exec -i blay_mysql sh -c 'exec mysql -uroot -p"YOUR_PASSWORD"' < ./mysql_init.sql
```

## Docker 명령어
* container 시작
```
docker container start CONTAINER_NAME
```
* container 중지
```
docker container stop CONTAINER_NAME
```
* container 재시작
```
docker container restart CONTAINER_NAME
```
* container 로그
```
docker container logs CONTAINER_NAME
```

## 실행 환경
* Docker: 20.10.2, build 2291f61
* OS: Ubuntu 18.04 (WSL2)

---

# REST API Reference
* Servers:
  * Production server: https://some.app.server
  * Test server: https://some.app.server/test

[여기](https://engineering.linecorp.com/ko/blog/document-engineering-api-documentation/)를 참고하여 만든 REST API 문서입니다.

## Summary
| Members | Descriptions
|--|--
| POST /auth/email-verification | 사용자 이메일 인증
| POST /auth/logIn | 사용자 로그인
| POST /auth/resend-email | 사용자 이메일 재전송
| POST /auth/reset-password | 사용자 비밀번호 변경
| POST /auth/join | 사용자 회원가입

## Common response
| Fields | Type | Description
|--|--|--
| error | string | 에러를 짧은 문장으로 표현합니다. (예: INTERNAL_SERVER_ERROR)
| message | string | 에러에 대한 상세한 내용 혹은 JWT와 같은 결과값이 들어갑니다.
| rescode | number | HTML 상태 코드에 대한 서브 코드입니다. [HTTP status sub code](#http-status-sub-code)를 참고하십시오.

## 사용자 이메일 인증 POST /auth/email-verification
Request 받은 JWT(token)을 이용해 사용자 이메일 인증을 수행합니다. 인증이 성공적으로 수행되면 200 OK를 반환하며, 인증 중 발생한 오류는 response 객체의 error, message 필드에 나타납니다. [Common response](#common-response) 필드를 참고하십시오.
### Request parameters
| Parameter | Type | Description
|--|--|--
| Apim-key(header) | string | Azure API Management 구독 키입니다. 이 필드는 Test API를 실행할 때만 필요합니다.
| token(body) | string | 이메일 인증을 수행하는 사용자 JWT입니다.
### Response
> **NOTE**
>
> 이 API는 [Common response](#common-response) 필드를 함께 반환합니다. 해당 항목을 참고하십시오.
### 성공 예제:
```json
{
  "error": "",
  "message": "",
  "rescode": 200
}
```
### 실패 예제:
```json
{
  "error": "NOT_EXISTED_JWT",
  "message": "JWT was not existed",
  "rescode": 902
}
```

## 사용자 로그인 POST /auth/logIn
Request 받은 아이디(email), 비밀번호(password)를 이용해 사용자 로그인을 수행합니다. 로그인이 성공적으로 수행되면 200 OK를 반환하며, 로그인 중 발생한 오류는 response 객체의 error, message 필드에 나타납니다. [Common response](#common-response) 필드를 참고하십시오.
### Request parameters
| Parameter | Type | Description
|--|--|--
| Apim-key(header) | string | Azure API Management 구독 키입니다. 이 필드는 Test API를 실행할 때만 필요합니다.
| email(body) | string | 로그인을 수행하는 사용자 이메일입니다.
| password(body) | string | 로그인을 수행하는 사용자 비밀번호입니다.
### Response
> **NOTE**
>
> 이 API는 [Common response](#common-response) 필드를 함께 반환합니다. 해당 항목을 참고하십시오.
### 성공 예제:
```json
{
  "error": "",
  "message": {
    "id": 1,
    "verified": "Y",
    "createdDate": "2021-04-28 02:41:38",
    "email": "revi@innovirus.biz",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwidmVyaWZpZWQiOiJZIiwiY3JlYXRlZERhdGUiOiIyMDIxLTA1LTAzIDA1OjQwOjQ5IiwiZW1haWwiOiJyZXZpQGlubm92aXJ1cy5iaXoiLCJpYXQiOjE2MjAzNzY1NDMsImV4cCI6MTYyMDk4MTM0M30.puchdCEzkrcakkJaoXyUkLh1twQy9rR61EBGAyG4omk"
  },
  "rescode": 200
}
```
### Object definition
**message**
| Field | Type | Description
|--|--|--
| id | string | 사용자의 고유 ID입니다.
| verified | char | 사용자의 이메일 인증 여부입니다. 인증된 경우 "Y", 아닌 경우 "N"입니다.
| createdDate | string | 사용자의 계정 생성 날짜입니다.
| email | string | 사용자의 이메일입니다.
| token | string | 사용자의 id, verified, createdDate, email, 만료시간이 담긴 JWT입니다.

### 실패 예제:
```json
{
  "error": "INVALID_EMAIL",
  "message": "Given user email was invalid",
  "rescode": 900
}
```

## 사용자 이메일 재전송 POST /auth/resend-email
Request 받은 아이디(email), JWT(token)을 이용해 사용자 이메일 재전송을 수행합니다. email를 request로 받았을 경우 비밀번호 초기화 이메일을 재전송하며, JWT를 받았을 경우 이메일 인증 메일을 재전송합니다. 이메일 재전송이 성공적으로 수행되면 200 OK를 반환하며, 재전송 중 발생한 오류는 response 객체의 error, message 필드에 나타납니다. [Common response](#common-response) 필드를 참고하십시오.
### Request parameters
| Parameter | Type | Description
|--|--|--
| Apim-key(header) | string | Azure API Management 구독 키입니다. 이 필드는 Test API를 실행할 때만 필요합니다.
| email(body) | string | 이메일 인증 메일 재전송을 수행하는 사용자 이메일입니다.
| token(body) | string | 비밀번호 초기화 메일 재전송을 수행하는 사용자 JWT입니다.
### Response
> **NOTE**
>
> 이 API는 [Common response](#common-response) 필드를 함께 반환합니다. 해당 항목을 참고하십시오.
### 성공 예제:
```json
{
  "error": "",
  "message": "",
  "rescode": 200
}
```
### 실패 예제:
```json
{
  "error": "INVALID_DEMAND",
  "message": "Too many attempts to reset your password",
  "rescode": 900
}
```

## 사용자 비밀번호 변경 POST /auth/reset-password
Request 받은 아이디(email), 비밀번호(password)를 이용해 사용자 비밀번호 변경을 수행합니다. 비밀번호 변경이 성공적으로 수행되면 200 OK를 반환하며, 초기화 중 발생한 오류는 response 객체의 error, message 필드에 나타납니다. [Common response](#common-response) 필드를 참고하십시오.
### Request parameters
| Parameter | Type | Description
|--|--|--
| Apim-key(header) | string | Azure API Management 구독 키입니다. 이 필드는 Test API를 실행할 때만 필요합니다.
| email(body) | string | 비밀번호 변경을 수행하는 사용자 이메일입니다.
| password(body) | string | 비밀번호 변경을 수행하는 사용자 비밀번호입니다.
### Response
> **NOTE**
>
> 이 API는 [Common response](#common-response) 필드를 함께 반환합니다. 해당 항목을 참고하십시오.
### 성공 예제:
```json
{
  "error": "",
  "message": "",
  "rescode": 200
}
```
### 실패 예제:
```json
{
  "error": "INVALID_EMAIL",
  "message": "Given password reset email was expired",
  "rescode": 900
}
```

## 사용자 회원가입 POST /auth/join
Request 받은 아이디(email), 비밀번호(password), 약관(termsAndConditions, personalInformationTerms, newsTerms)을 이용해 사용자 회원가입을 수행합니다. 회원가입이 성공적으로 수행되면 200 OK를 반환하며, 회원가입 수행 중 발생한 오류는 response 객체의 error, message 필드에 나타납니다. [Common response](#common-response) 필드를 참고하십시오.
### Request parameters
| Parameter | Type | Description
|--|--|--
| Apim-key(header) | string | Azure API Management 구독 키입니다. 이 필드는 Test API를 실행할 때만 필요합니다.
| email(body) | string | 회원가입을 수행하는 사용자 이메일입니다.
| password(body) | string | 회원가입을 수행하는 사용자 비밀번호입니다.
| termsAndConditions(body) | bool | 회원가입을 수행하는 사용자 이용약관 동의 여부입니다.
| personalInformationTerms(body) | bool | 회원가입을 수행하는 사용자 개인정보 제공 동의 여부입니다.
| newsTerms(body) | bool | 회원가입을 수행하는 사용자 blay 소식 이메일 동의 여부입니다.
### Response
> **NOTE**
>
> 이 API는 [Common response](#common-response) 필드를 함께 반환합니다. 해당 항목을 참고하십시오.
### 성공 예제:
```json
{
  "error": "",
  "message": {
    "id": 1,
    "verified": "Y",
    "createdDate": "2021-04-28 02:41:38",
    "email": "revi@innovirus.biz",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwidmVyaWZpZWQiOiJZIiwiY3JlYXRlZERhdGUiOiIyMDIxLTA1LTAzIDA1OjQwOjQ5IiwiZW1haWwiOiJyZXZpQGlubm92aXJ1cy5iaXoiLCJpYXQiOjE2MjAzNzY1NDMsImV4cCI6MTYyMDk4MTM0M30.puchdCEzkrcakkJaoXyUkLh1twQy9rR61EBGAyG4omk"
  },
  "rescode": 200
}
```
### Object definition
**message**
| Field | Type | Description
|--|--|--
| id | string | 사용자의 고유 ID입니다.
| verified | char | 사용자의 이메일 인증 여부입니다. 인증된 경우 "Y", 아닌 경우 "N"입니다.
| createdDate | string | 사용자의 계정 생성 날짜입니다.
| email | string | 사용자의 이메일입니다.
| token | string | 사용자의 id, verified, createdDate, email, 만료시간이 담긴 JWT입니다.

### 실패 예제:
```json
{
  "error": "NOT_VERIFIED",
  "message": "Given user was not verified",
  "rescode": 900
}
```

# HTTP status sub code
기존의 HTTP 상태 코드에서 백엔드 수행 결과를 좀 더 세부적으로 전송하기 위한 필드입니다.
| Status | Description |
|--|--|
| 500 | 서버에서 Database 오류가 발생한 경우입니다.
| 900 | 사용자 실수, 고의 등으로 발생한 경우입니다.
| 901 | 이메일 전송 중 에러가 발생한 경우입니다.
| 902 | JWT 인증 중 에러가 발생한 경우입니다.

---

# 개발 방법론
blay는 특수한 상황으로부터 발생하는 특수한 문제들이 있습니다. 테크 스택의 통일이 안 된다는 문제부터 서로 동시간대에 일하고 있지 않을 가능성이 더 높다는 점, 언제든지 인원 변동이 있을 수 있다는 점, 그리고 그 와중에 스타트업의 장점을 살려서 언제든지 기민하게 반응할 수 있는 개발 구조를 가져야 한다는 점이 있습니다.

그래서 이걸 해결하기 위하여 현재 채택한 개발론은 무조건 API의 한 엔드포인트는 index.js 파일 하나로만 구현해내는 방식이었습니다. 이 방식은 다음과 같은 이점이 있습니다.
* 결합도를 극단적으로 낮추어 각 엔드포인트의 코드가 서로 맞물려있는 다른 코드가 전혀 없기 때문에 한 엔드포인트가 고장이 났을 때 딱 그 파일 하나만 봐서 고칠 수 있는 장점이 있으며, 새로운 인원이 들어왔을 때 서버의 작동 방식을 이해하기 위해 코드베이스 전체를 봐야 할 필요 없이 엔드포인트 하나만 보면 됩니다. 
* 작업 중인 인원이 나갔을 때 최악의 케이스로 잃는 코드가 많아 봤자 한 파일 수준이며, 개발 중인 다른 작업물을 기다려야만 작업을 진행할 수 있는 상황이 사라집니다.
* 새로운 API가 개발되어야 하거나 기존 API에 큰 변경 사항이 있어야 할 때 이 한 줄을 고치는 게 서버 전체를 고장 내는 상황들을 방지 할 수 있어 더욱 기민한 반응이 가능한 구조입니다.
