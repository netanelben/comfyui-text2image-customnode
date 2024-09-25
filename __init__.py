import os
import server
from aiohttp import web
from .config import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

WEBROOT = os.path.join(os.path.dirname(os.path.realpath(__file__)), "web/dist")

@server.PromptServer.instance.routes.get("/Text2Image")
def deungeon_entrance(request):
    return web.FileResponse(os.path.join(WEBROOT, "index.html"))

server.PromptServer.instance.routes.static("/assets", path=os.path.join(WEBROOT, "assets"))

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']
