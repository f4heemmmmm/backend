FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production --silent

COPY . .

RUN npm run build

EXPOSE 3000 

CMD ["node", "dist/main"]