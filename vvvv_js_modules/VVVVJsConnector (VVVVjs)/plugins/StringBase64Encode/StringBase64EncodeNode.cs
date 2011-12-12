#region usings
using System;
using System.ComponentModel.Composition;

using VVVV.PluginInterfaces.V1;
using VVVV.PluginInterfaces.V2;
using VVVV.Utils.VColor;
using VVVV.Utils.VMath;
using System.Security.Cryptography;

using VVVV.Core.Logging;
#endregion usings

namespace VVVV.Nodes
{
	#region PluginInfo
	[PluginInfo(Name = "Base64Encode", Category = "String", Help = "Basic template with one string in/out", Tags = "")]
	#endregion PluginInfo
	public class StringBase64EncodeNode : IPluginEvaluate
	{
		#region fields & pins
		[Input("Input", DefaultString = "hello c#")]
		ISpread<string> FInput;

		[Output("Output")]
		ISpread<string> FOutput;

		[Import()]
		ILogger FLogger;
		#endregion fields & pins
		
		String MagicKEY = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

		//called when data for any output pin is requested
		public void Evaluate(int SpreadMax)
		{
			FOutput.SliceCount = SpreadMax;
			SHA1 sha = new SHA1CryptoServiceProvider(); 

			for (int i = 0; i < SpreadMax; i++)
			{
				String ret = FInput[i]+MagicKEY;
				byte[] sha1Hash = sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes(ret));
				FOutput[i] = Convert.ToBase64String(sha1Hash);
				
			}

			//FLogger.Log(LogType.Debug, "Logging to Renderer (TTY)");
		}
	}
}
