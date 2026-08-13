#!/usr/bin/env python3
"""删除失败函数并重新创建 HTTP 函数"""
import os
import json
import base64
from tencentcloud.common import credential
from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile
from tencentcloud.scf.v20180416 import scf_client, models

cred = credential.Credential(
    os.getenv("TENCENT_SECRET_ID", "YOUR_SECRET_ID"),
    os.getenv("TENCENT_SECRET_KEY", "YOUR_SECRET_KEY"),
)
httpProfile = HttpProfile()
httpProfile.endpoint = "scf.tencentcloudapi.com"
clientProfile = ClientProfile()
clientProfile.httpProfile = httpProfile
client = scf_client.ScfClient(cred, "ap-shanghai", clientProfile)

# 先删除失败的函数
try:
    req = models.DeleteFunctionRequest()
    req.FunctionName = "account-book-proxy"
    req.Namespace = "default"
    client.DeleteFunction(req)
    print("Deleted old function")
except Exception as e:
    print(f"Delete failed: {getattr(e, 'code', '?')} - {getattr(e, 'message', '')}")

# 读取 zip 文件
with open("/tmp/scf_deploy.zip", "rb") as f:
    zip_b64 = base64.b64encode(f.read()).decode()

# 创建 HTTP 函数
print("Creating HTTP function with scf_bootstrap...")
req = models.CreateFunctionRequest()
req.FunctionName = "account-book-proxy"
req.Runtime = "Nodejs18.15"
req.Handler = "scf_bootstrap"
req.Timeout = 60
req.Namespace = "default"
req.Type = "HTTP"
req.Code = models.Code()
req.Code.ZipFile = zip_b64

try:
    resp = client.CreateFunction(req)
    print("Create request submitted")
    print(resp.to_json_string(indent=2))
except Exception as e:
    code = getattr(e, 'code', '?')
    msg = getattr(e, 'message', '')
    print(f"Create failed: code={code} msg='{msg}'")
