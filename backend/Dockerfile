FROM python:3.12-slim
ENV TZ=Asia/Shanghai
WORKDIR /app
COPY requirements.txt .

RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
COPY . .
EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host","0.0.0.0", "--port", "8000"]
